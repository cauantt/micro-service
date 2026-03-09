import { Controller, Get, Logger, InternalServerErrorException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { metrics } from '@opentelemetry/api';

const meter = metrics.getMeter('auth-service-meter');

// 1. Contador de Erros
const errorCounter = meter.createCounter('auth_errors_total', {
  description: 'Total de erros no auth-service',
});

// 2. Histograma de Latência (Tempo de Resposta do Banco)
const dbLatency = meter.createHistogram('auth_db_duration_ms', {
  description: 'Duração das consultas ao banco em milissegundos',
  unit: 'ms',
});

@Controller('api')
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private dataSource: DataSource) {}

  @Get('test')
  async getHello() {
    const start = Date.now(); // Início do cronômetro

    this.logger.log('Iniciando consulta ao banco...');
    
    try {
      const result = await this.dataSource.query('SELECT NOW()');
      
      // Calcula o tempo e registra no Prometheus
      const duration = Date.now() - start;
      dbLatency.record(duration); 

      return { 
        status: 'Sucesso', 
        latencia_db: `${duration}ms` 
      };
    } catch (e) {
      errorCounter.add(1);
      throw new InternalServerErrorException('Erro ao acessar o banco');
    }
  }

  // Rota para "fazer o sistema sangrar" e testar o gráfico de erros
  @Get('error')
  async triggerError() {
    errorCounter.add(1);
    this.logger.error('Simulando um erro crítico para o Dashboard!');
    throw new InternalServerErrorException('Simulação de falha');
  }
}