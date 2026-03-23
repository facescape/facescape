module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const FAL_KEY = process.env.FAL_API_KEY;
  if (!FAL_KEY) {
    return res.status(500).json({ error: 'Clé API non configurée' });
  }

  const { request_id } = req.query;
  if (!request_id) {
    return res.status(400).json({ error: 'request_id manquant' });
  }

  try {
    // 1. Vérifier le statut
    const statusRes = await fetch(
      `https://queue.fal.run/fal-ai/kling-video/v2.6/pro/image-to-video/requests/${request_id}/status`,
      { headers: { 'Authorization': `Key ${FAL_KEY}` } }
    );
    const statusData = await statusRes.json();
    console.log('Status response:', JSON.stringify(statusData));

    if (statusData.status !== 'COMPLETED') {
      return res.status(200).json({ status: statusData.status || 'IN_PROGRESS' });
    }

    // 2. COMPLETED → appeler /response pour récupérer le résultat
    const responseUrl = `https://queue.fal.run/fal-ai/kling-video/v2.6/pro/image-to-video/requests/${request_id}/response`;
    const resultRes = await fetch(responseUrl, {
      headers: { 'Authorization': `Key ${FAL_KEY}` }
    });
    const resultData = await resultRes.json();
    console.log('Result response:', JSON.stringify(resultData));

    // D'après la doc : résultat dans video.url
    const videoUrl = resultData?.video?.url || null;
    console.log('videoUrl:', videoUrl);

    return res.status(200).json({
      status: 'COMPLETED',
      video_url: videoUrl,
      raw: resultData
    });

  } catch (err) {
    console.error('Erreur:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
