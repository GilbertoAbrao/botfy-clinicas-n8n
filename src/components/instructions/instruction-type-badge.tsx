'use client';

import {
  Stethoscope,
  UtensilsCrossed,
  Pill,
  Shirt,
  Users,
  FileText,
  Info,
  LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { InstructionType, INSTRUCTION_TYPE_LABELS } from '@/lib/validations/instruction';

interface InstructionTypeBadgeProps {
  type: InstructionType;
}

interface TypeConfig {
  icon: LucideIcon;
  bgColor: string;
  textColor: string;
  borderColor: string;
}

const TYPE_CONFIG: Record<InstructionType, TypeConfig> = {
  preparo: {
    icon: Stethoscope,
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
  },
  jejum: {
    icon: UtensilsCrossed,
    bgColor: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
  },
  medicamentos: {
    icon: Pill,
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
  },
  vestuario: {
    icon: Shirt,
    bgColor: 'bg-pink-50',
    textColor: 'text-pink-700',
    borderColor: 'border-pink-200',
  },
  acompanhante: {
    icon: Users,
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
  },
  documentos: {
    icon: FileText,
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
  },
  geral: {
    icon: Info,
    bgColor: 'bg-gray-50',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-200',
  },
};

export function InstructionTypeBadge({ type }: InstructionTypeBadgeProps) {
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;
  const label = INSTRUCTION_TYPE_LABELS[type];

  return (
    <Badge
      variant="outline"
      className={`${config.bgColor} ${config.textColor} ${config.borderColor} gap-1`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}
