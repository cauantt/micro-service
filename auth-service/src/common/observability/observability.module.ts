import { Module } from '@nestjs/common';
import { ObservabilityListener } from './observability.listener';

/**
 * Módulo de observabilidade.
 * Depende de WinstonModule e MetricsModule — ambos são @Global() e já
 * estão registrados no AppModule, então não precisamos re-importá-los aqui.
 */
@Module({
  providers: [ObservabilityListener],
})
export class ObservabilityModule {}
