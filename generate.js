module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const FAL_KEY = process.env.FAL_API_KEY;
  if (!FAL_KEY) {
    return res.status(500).json({ error: 'Clé API non configurée' });
  }

  try {
    const { prompt, image_url } = req.body;
    if (!prompt || !image_url) {
      return res.status(400).json({ error: 'Paramètres manquants' });
    }

    const response = await fetch('https://fal.run/fal-ai/flux-pro/kontext/max', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `The subject's face, facial features, skin tone, eye color, beard, glasses and identity must remain completely unchanged and perfectly preserved. Same person, same face. Only change the environment, costume and background. ${prompt}. Ultra photorealistic, cinematic lighting, 8k, highly detailed.`,
        image_url,
        image_size: 'portrait_4_3',
        num_inference_steps: 40,
        guidance_scale: 4.0,
        num_images: 1,
        enable_safety_checker: true
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.detail || data.message || `Erreur API (${response.status})` });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
