import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'kdp-tracker', timestamp: new Date().toISOString() });
  });

  // Direct 1-Click Amazon Ads Fetch API
  app.post('/api/amazon/fetch', async (req: Request, res: Response) => {
    try {
      const entityId = (req.body.entityId || 'ENTITY10NY3ZV74DMDV').trim();
      const year = req.body.year || new Date().getFullYear();
      const month = req.body.month || (new Date().getMonth() + 1);
      const cookie = req.headers['x-amazon-cookie'] as string || req.body.cookie || process.env.AMAZON_SESSION_COOKIE || '';
      const isSimulation = Boolean(req.body.simulate);

      const targetUrl = `https://advertising.amazon.fr/campaign-manager/all-campaigns?entityId=${encodeURIComponent(entityId)}`;

      // If user requested a simulated/test run of the 1-click fetch
      if (isSimulation) {
        // Return realistic values based on month
        const mockAds = Math.round((48.50 + (month * 3.20)) * 100) / 100;
        const mockRev = Math.round((185.00 + (month * 12.40)) * 100) / 100;
        return res.json({
          success: true,
          mode: 'simulation',
          entityId,
          year,
          month,
          adsCost: mockAds,
          revenue: mockRev,
          source: 'test_sync',
          message: `Données Amazon Ads synchronisées avec succès pour ${entityId} (${month}/${year}) !`,
        });
      }

      // If no session cookie is configured
      if (!cookie || cookie.trim().length < 10) {
        return res.status(401).json({
          success: false,
          code: 'AUTH_REQUIRED',
          entityId,
          targetUrl,
          message: `Vous êtes bien connecté à Amazon dans votre navigateur, mais la sécurité de votre navigateur (Chrome/Safari/Firefox) interdit à un site externe d'accéder à vos cookies privés. Utilisez le marque-page 1-Clic dans votre onglet Amazon ou le bouton "Détecter Coût total".`,
        });
      }

      // Perform real fetch to Amazon Advertising France
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cookie': cookie.trim(),
          'Cache-Control': 'no-cache',
        },
        redirect: 'manual', // do not follow auth redirects silently
      });

      // If Amazon redirects to login (status 302, 301, 303)
      if (response.status >= 300 && response.status < 400) {
        const redirectLocation = response.headers.get('location') || '';
        if (redirectLocation.includes('signin') || redirectLocation.includes('ap/signin')) {
          return res.status(401).json({
            success: false,
            code: 'SESSION_EXPIRED',
            entityId,
            message: 'Votre session Amazon Ads a expiré. Veuillez renouveler votre cookie de connexion.',
          });
        }
      }

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          code: `HTTP_${response.status}`,
          entityId,
          message: `Amazon Ads a répondu avec le statut ${response.status} (${response.statusText}).`,
        });
      }

      const html = await response.text();

      // Extract spend and sales from Amazon Advertising page
      let extractedAds: number | null = null;
      let extractedRev: number | null = null;

      // 1. Regex search for spend in French and English — Priorité absolue à "Coût total"
      const adsPatterns = [
        // Recherche prioritaire du chiffre après "Coût total" (format Amazon Ads France)
        /Co[uû]t\s+total\s*[:\n\r\t]*€?\s*([0-9\s]+(?:[,.][0-9]{1,2})?)/i,
        /Co[uû]t\s+total[^\d\n\r]{0,40}?([0-9\s]+[,.][0-9]{2})/i,
        /Total\s+des\s+co[uû]ts\s*[:\n\r\t]*€?\s*([0-9\s]+(?:[,.][0-9]{1,2})?)/i,
        /Total\s+cost\s*[:\n\r\t]*€?\s*([0-9\s]+(?:[,.][0-9]{1,2})?)/i,
        /"totalCost"\s*:\s*([0-9.]+)/i,
        /"total_cost"\s*:\s*([0-9.]+)/i,
        /"costTotal"\s*:\s*([0-9.]+)/i,
        /Co[uû]t\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
        /D[ée]penses?\s*(?:totales?)?\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
        /Spend\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
        /([0-9\s]+[,.][0-9]{2})\s*€\s*d[ée]pens[ée]s?/i,
        /"spend"\s*:\s*([0-9.]+)/i,
        /"totalSpend"\s*:\s*([0-9.]+)/i,
      ];

      for (const rx of adsPatterns) {
        const match = html.match(rx);
        if (match && match[1]) {
          const val = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
          if (!isNaN(val) && val >= 0) {
            extractedAds = val;
            break;
          }
        }
      }

      // 2. Regex search for sales / royalties
      const revPatterns = [
        /Redevances?\s*(?:estim[ée]es?)?\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
        /Chiffre\s+d'affaires\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
        /Ventes\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
        /Sales\s*[:\n\r]*€?\s*([0-9\s]+[,.][0-9]{2})/i,
        /"sales"\s*:\s*([0-9.]+)/i,
        /"totalSales"\s*:\s*([0-9.]+)/i,
      ];

      for (const rx of revPatterns) {
        const match = html.match(rx);
        if (match && match[1]) {
          const val = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
          if (!isNaN(val) && val >= 0) {
            extractedRev = val;
            break;
          }
        }
      }

      if (extractedAds === null && extractedRev === null) {
        return res.json({
          success: false,
          code: 'PARSING_FAILED',
          entityId,
          message: 'La page Amazon a été chargée mais les métriques de campagne n’ont pas pu être lues (interface dynamique JavaScript).',
        });
      }

      return res.json({
        success: true,
        entityId,
        year,
        month,
        adsCost: extractedAds,
        revenue: extractedRev,
        source: 'live_amazon_fetch',
        message: 'Données Amazon Ads récupérées en direct avec succès !',
      });
    } catch (error: any) {
      console.error('Error in /api/amazon/fetch:', error);
      return res.status(500).json({
        success: false,
        code: 'SERVER_ERROR',
        message: `Erreur interne lors de la requête Amazon Ads : ${error.message}`,
      });
    }
  });

  // Serve static files in production or Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 KDP Business Tracker Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
