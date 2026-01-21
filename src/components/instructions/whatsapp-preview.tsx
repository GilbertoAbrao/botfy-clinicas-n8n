'use client';

import { useMemo } from 'react';
import { AlertTriangle, Check } from 'lucide-react';

interface WhatsAppPreviewProps {
  content: string;
  title?: string;
}

// Brazilian sample data for template variable replacement
const SAMPLE_DATA: Record<string, string> = {
  '{nome_paciente}': 'Joao Silva',
  '{data_consulta}': '15/01 as 14h',
  '{servico}': 'Limpeza de Pele',
  '{profissional}': 'Dra. Paula',
  '{clinica}': 'Clinica Estetica',
};

// Character thresholds for warnings
const CHAR_WARNING_THRESHOLD = 1000;
const CHAR_DANGER_THRESHOLD = 2000;

export function WhatsAppPreview({ content, title }: WhatsAppPreviewProps) {
  // Replace template variables with sample data
  const processedContent = useMemo(() => {
    if (!content) return '';

    let result = content;
    Object.entries(SAMPLE_DATA).forEach(([variable, value]) => {
      result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value);
    });
    return result;
  }, [content]);

  const charCount = content?.length || 0;

  // Determine warning level
  const warningLevel = useMemo(() => {
    if (charCount >= CHAR_DANGER_THRESHOLD) return 'danger';
    if (charCount >= CHAR_WARNING_THRESHOLD) return 'warning';
    return 'ok';
  }, [charCount]);

  if (!content) {
    return (
      <div className="rounded-lg bg-gray-100 p-4 text-center text-sm text-gray-500">
        Digite o conteudo para ver a pre-visualizacao
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Preview label */}
      <div className="text-sm font-medium text-gray-700">
        Pre-visualizacao WhatsApp
      </div>

      {/* WhatsApp chat background */}
      <div
        className="rounded-lg p-4"
        style={{ backgroundColor: '#ECE5DD' }}
      >
        {/* Message bubble */}
        <div className="flex justify-end">
          <div
            className="relative max-w-[85%] rounded-lg px-3 py-2 shadow-sm"
            style={{ backgroundColor: '#DCF8C6' }}
          >
            {/* Bubble tail */}
            <div
              className="absolute top-0 -right-1.5 w-3 h-3"
              style={{
                backgroundColor: '#DCF8C6',
                clipPath: 'polygon(0 0, 100% 0, 0 100%)',
              }}
            />

            {/* Title if present */}
            {title && (
              <div className="text-sm font-semibold text-gray-900 mb-1">
                {title}
              </div>
            )}

            {/* Content with preserved whitespace */}
            <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
              {processedContent}
            </div>

            {/* Timestamp and check marks */}
            <div className="flex items-center justify-end gap-0.5 mt-1">
              <span className="text-[10px] text-gray-500">14:30</span>
              <div className="flex -space-x-1">
                <Check className="h-3 w-3 text-blue-500" />
                <Check className="h-3 w-3 text-blue-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Character count with warnings */}
      <div className={`flex items-center gap-2 text-sm ${
        warningLevel === 'danger'
          ? 'text-red-600'
          : warningLevel === 'warning'
            ? 'text-yellow-600'
            : 'text-gray-500'
      }`}>
        {warningLevel !== 'ok' && (
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        )}
        <span>
          {charCount.toLocaleString('pt-BR')} caracteres
          {warningLevel === 'warning' && ' - Mensagem longa, pode ser truncada em alguns dispositivos'}
          {warningLevel === 'danger' && ' - Mensagem muito longa, considere resumir'}
        </span>
      </div>

      {/* Template variables hint */}
      <div className="text-xs text-gray-400 border-t pt-2 mt-2">
        Variaveis disponiveis: {'{nome_paciente}'}, {'{data_consulta}'}, {'{servico}'}, {'{profissional}'}, {'{clinica}'}
      </div>
    </div>
  );
}
