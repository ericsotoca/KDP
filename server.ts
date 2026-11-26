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
      const isSimulation = Boolean(req.body.simulate);

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

      // Désactivation côté serveur de toute récupération par cookie de session.
      // Les cookies Amazon sont des identifiants sensibles et ne doivent pas transiter ici.
      return res.status(410).json({
        success: false,
        code: 'DIRECT_FETCH_DISABLED',
        entityId,
        message: 'La récupération directe par cookie est désactivée. Utilisez le raccourci local qui lit les montants affichés dans votre navigateur.',
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
