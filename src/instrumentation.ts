/*instrumentation.ts*/
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import {
  PeriodicExportingMetricReader,
} from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

// OTLP endpoint - defaults to Docker Compose setup, can be overridden via env var
const otlpMetricsUrl = process.env.OTLP_METRICS_URL || 'http://otel-collector:4318/v1/metrics';
// Export interval in milliseconds - defaults to 10 seconds
const exportIntervalMillis = parseInt(process.env.OTLP_METRICS_EXPORT_INTERVAL || '10000', 10);

const sdk = new NodeSDK({
  traceExporter: new ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: otlpMetricsUrl,
    }),
    exportIntervalMillis,
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
