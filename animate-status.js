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
    console.log('Kling status:', JSON.stringify(statusData));

    if (statusData.status !== 'COMPLETED') {
      return res.status(200).json({ status: statusData.status || 'IN_PROGRESS' });
    }

    // 2. Si COMPLETED → récupérer le résultat
    const resultRes = await fetch(
      `https://queue.fal.run/fal-ai/kling-video/v2.6/pro/image-to-video/requests/${request_id}`,
      { headers: { 'Authorization': `Key ${FAL_KEY}` } }
    );
    const resultData = await resultRes.json();
    console.log('Kling result complet:', JSON.stringify(resultData));

    // Chercher l'URL dans toutes les structures possibles de Kling
    const videoUrl =
      resultData?.video?.url ||
      resultData?.videos?.[0]?.url ||
      resultData?.output?.video?.url ||
      resultData?.output?.video_url ||
      resultData?.video_url ||
      null;

    return res.status(200).json({
      status: 'COMPLETED',
      video_url: videoUrl,
      raw: resultData
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
