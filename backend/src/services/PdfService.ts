import puppeteer from 'puppeteer';

export interface ReportData {
  studentName: string;
  grade: string;
  evaluationDate: string;
  riskLevel: string;
  summary: string;
  recommendations: string;
  trends: any[];
  appUsage: any;
}

export class PdfService {
  static async generateReport(reportData: ReportData): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      
      const html = this.generateReportHTML(reportData);
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });

      await browser.close();
      return pdfBuffer;
    } catch (error) {
      await browser.close();
      throw error;
    }
  }

  private static generateReportHTML(data: ReportData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Informe de Bienestar Mental</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #4CAF50;
            margin: 0;
          }
          .header p {
            color: #666;
            margin: 5px 0 0 0;
          }
          .section {
            margin-bottom: 30px;
          }
          .section h2 {
            color: #2196F3;
            border-bottom: 2px solid #2196F3;
            padding-bottom: 10px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-item {
            background: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
          }
          .info-item strong {
            display: block;
            color: #666;
            font-size: 12px;
          }
          .risk-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            color: white;
            font-size: 14px;
          }
          .risk-bajo { background-color: #4CAF50; }
          .risk-medio { background-color: #FF9800; }
          .risk-alto { background-color: #f44336; }
          .recommendations {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #2196F3;
          }
          .recommendations ul {
            margin: 10px 0;
            padding-left: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Informe de Bienestar Mental</h1>
          <p>Wellness Mental App - Evaluación de Salud de Usuarios</p>
        </div>

        <div class="section">
          <h2>Información del Usuario</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Nombre</strong>
              ${data.studentName}
            </div>
            <div class="info-item">
              <strong>Grado</strong>
              ${data.grade}
            </div>
            <div class="info-item">
              <strong>Fecha de Evaluación</strong>
              ${data.evaluationDate}
            </div>
            <div class="info-item">
              <strong>Nivel de Riesgo</strong>
              <span class="risk-badge risk-${data.riskLevel.toLowerCase()}">${data.riskLevel}</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Resumen de la Evaluación</h2>
          <p>${data.summary}</p>
        </div>

        <div class="section">
          <h2>Recomendaciones</h2>
          <div class="recommendations">
            ${data.recommendations}
          </div>
        </div>

        <div class="section">
          <h2>Tendencias (Últimos 3 Meses)</h2>
          <p>Gráfico de evolución del nivel de estrés y bienestar</p>
        </div>

        <div class="section">
          <h2>Uso de la Aplicación</h2>
          <div class="info-grid">
            <div class="info-item">
              <strong>Ejercicios Completados</strong>
              ${data.appUsage.exercises || 0}
            </div>
            <div class="info-item">
              <strong>Sesiones de Chat</strong>
              ${data.appUsage.chats || 0}
            </div>
            <div class="info-item">
              <strong>Evaluaciones Realizadas</strong>
              ${data.appUsage.evaluations || 0}
            </div>
            <div class="info-item">
              <strong>Días de Actividad</strong>
              ${data.appUsage.activeDays || 0}
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Este informe es confidencial y está destinado exclusivamente para los padres/tutores del usuario.</p>
          <p>Generado el ${new Date().toLocaleDateString('es-ES')}</p>
          <p>Wellness Mental App - Apoyo para el bienestar de usuarios</p>
        </div>
      </body>
      </html>
    `;
  }
}
