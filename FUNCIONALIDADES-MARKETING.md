# Botfy AI ClinicOps - Documento de Funcionalidades

> **Para uso da equipe de Marketing e Vendas**
> Última atualização: Janeiro 2026 | Versão 1.0

---

## Índice

1. [Visão Geral do Produto](#visão-geral-do-produto)
2. [Proposta de Valor](#proposta-de-valor)
3. [Funcionalidades Principais](#funcionalidades-principais)
4. [Diferenciais Competitivos](#diferenciais-competitivos)
5. [Benefícios por Público](#benefícios-por-público)
6. [Comparativo: Antes vs. Depois](#comparativo-antes-vs-depois)
7. [Especificações Técnicas](#especificações-técnicas)
8. [Integrações](#integrações)
9. [Segurança e Compliance](#segurança-e-compliance)
10. [Planos e Roadmap](#planos-e-roadmap)
11. [FAQ para Vendas](#faq-para-vendas)
12. [Materiais de Apoio](#materiais-de-apoio)

---

## Visão Geral do Produto

### O que é o Botfy AI ClinicOps?

**Botfy AI ClinicOps** é uma plataforma completa de automação inteligente para clínicas odontológicas e estéticas. Combina um **assistente de IA no WhatsApp** com um **console administrativo** que funciona como centro de comando para toda a operação da clínica.

### Resumo em Uma Frase

> "Sistema de automação com IA que reduz faltas em até 70%, elimina 20+ ligações manuais por dia e permite que sua equipe foque no que importa: cuidar dos pacientes."

### Componentes do Sistema

| Componente | O que faz | Para quem |
|------------|-----------|-----------|
| **Assistente Marília (IA)** | Atende pacientes no WhatsApp 24/7, agenda consultas, confirma presença, reagenda | Pacientes |
| **Console Administrativo** | Painel de controle para equipe gerenciar alertas, agenda, pacientes | Equipe da clínica |
| **Motor de Automação** | Envia lembretes automáticos, detecta problemas, notifica equipe | Sistema (automático) |

---

## Proposta de Valor

### Problema que Resolvemos

Clínicas perdem dinheiro e tempo com:

- **Faltas (No-shows):** 15-20% dos pacientes não comparecem
- **Ligações manuais:** Equipe gasta horas ligando para confirmar
- **Conversas travadas:** IA não consegue ajudar e ninguém percebe
- **Reagendamentos lentos:** Cancelamentos não preenchem a agenda
- **Falta de visibilidade:** Problemas só são descobertos tarde demais

### Como Resolvemos

| Problema | Nossa Solução |
|----------|---------------|
| Faltas frequentes | Lembretes automáticos em 48h, 24h e 2h antes |
| Ligações manuais | IA confirma presença via WhatsApp |
| Conversas travadas | Alertas em tempo real com resolução em 1 clique |
| Agenda vazia após cancelamento | Lista de espera inteligente preenche automaticamente |
| Falta de visibilidade | Dashboard mostra tudo que precisa de atenção |

### Resultados Esperados

- **Redução de 70% nas faltas** (de 15% para menos de 5%)
- **Economia de 3+ horas/dia** em ligações manuais
- **Tempo de resposta a problemas:** de horas para segundos
- **Aumento de 10-15% no faturamento** por melhor ocupação da agenda

---

## Funcionalidades Principais

### 1. Assistente de IA "Marília" (WhatsApp)

A Marília é uma assistente virtual que atende pacientes no WhatsApp como se fosse uma secretária real.

#### O que a Marília faz:

| Funcionalidade | Descrição | Benefício |
|----------------|-----------|-----------|
| **Agendamento de consultas** | Encontra horários disponíveis e agenda automaticamente | Paciente agenda a qualquer hora, sem esperar |
| **Confirmação de presença** | Pergunta se paciente vai comparecer | Reduz incerteza sobre a agenda |
| **Reagendamento** | Permite trocar data/horário via chat | Flexibilidade sem ligar para clínica |
| **Cancelamento** | Processa cancelamentos e notifica equipe | Libera vaga rapidamente para lista de espera |
| **Informações sobre serviços** | Responde dúvidas sobre procedimentos | Atendimento 24/7 sem sobrecarregar equipe |
| **Pré-check-in** | Coleta dados antes da consulta | Consulta mais rápida e organizada |

#### Características Técnicas:
- Linguagem natural e humanizada
- Disponível 24 horas, 7 dias por semana
- Integração nativa com WhatsApp Business
- Personalidade configurável por clínica

---

### 2. Central de Alertas (Dashboard Principal)

Painel em tempo real que mostra TUDO que precisa de atenção humana.

#### Tipos de Alertas:

| Tipo | Quando Aparece | Ação Sugerida |
|------|----------------|---------------|
| **Conversa Travada** | IA não consegue ajudar o paciente | Intervir no WhatsApp ou limpar memória |
| **Pré-check-in Pendente** | Paciente não completou dados | Lembrar paciente ou completar manualmente |
| **Consulta Não Confirmada** | Paciente não respondeu confirmação | Ligar para paciente |
| **Handoff Normal** | Paciente pediu para falar com humano | Assumir conversa |
| **Erro de Sistema** | Falha na automação | Verificar e resolver |

#### Recursos da Central:

- **Priorização inteligente:** Alertas urgentes aparecem primeiro
- **Filtros avançados:** Por tipo, status, período, paciente
- **Detalhes completos:** Histórico do paciente, conversa, agendamentos
- **Ações em 1 clique:** Resolver sem sair da tela

---

### 3. Agenda Visual (Calendário)

Calendário interativo para gerenciar todos os agendamentos da clínica.

#### Recursos:

| Recurso | Descrição |
|---------|-----------|
| **Visualização flexível** | Dia, semana ou mês |
| **Múltiplos profissionais** | Cada um com cor própria |
| **Status visual** | Tentativo, confirmado, concluído, cancelado, falta |
| **Detecção de conflitos** | Avisa se horário já está ocupado |
| **Filtro por serviço** | Ver apenas procedimentos específicos |
| **Criação rápida** | Agendar em poucos cliques |

#### Indicadores Visuais:

| Cor/Status | Significado |
|------------|-------------|
| 🟡 Amarelo | Tentativo (aguardando confirmação) |
| 🟢 Verde | Confirmado |
| ✅ Cinza | Concluído |
| 🔴 Vermelho | Falta (no-show) |
| ⚫ Cancelado | Cancelado pelo paciente |

---

### 4. Lista de Espera Inteligente

Sistema que preenche automaticamente vagas de cancelamentos.

#### Como Funciona:

1. Paciente cancela consulta → vaga liberada
2. Sistema verifica lista de espera
3. Notifica automaticamente candidatos por prioridade
4. Primeiro a confirmar fica com a vaga

#### Níveis de Prioridade:

| Prioridade | Quando Usar |
|------------|-------------|
| **URGENTE** | Paciente com dor ou emergência |
| **ALTA** | Retorno importante ou tratamento em andamento |
| **NORMAL** | Consultas de rotina |

---

### 5. Gestão de Pacientes

Cadastro completo de pacientes com histórico integrado.

#### Informações do Cadastro:

| Categoria | Campos |
|-----------|--------|
| **Contato** | Nome, telefone (com DDI), email |
| **Documentos** | CPF, data de nascimento |
| **Endereço** | Rua, número, bairro, cidade, estado, CEP |
| **Convênio** | Nome do convênio, número da carteirinha |
| **Histórico** | Todas as consultas passadas e futuras |
| **Conversas** | Todo histórico de WhatsApp |
| **Documentos** | Arquivos anexados (exames, fotos, etc.) |

#### Recursos de Busca:

- Busca por nome (parcial)
- Busca por telefone (com ou sem DDI)
- Busca por CPF (com ou sem formatação)
- Resultados em menos de 0,5 segundo

---

### 6. Monitoramento de Conversas

Visualização de todas as conversas do WhatsApp em tempo real.

#### Recursos:

| Recurso | Descrição |
|---------|-----------|
| **Visualização estilo WhatsApp** | Interface familiar |
| **Identificação de remetente** | Mensagens da IA vs. paciente |
| **Status de entrega** | Enviado, entregue, lido |
| **Histórico completo** | Todas as mensagens em ordem |
| **Filtro por status** | IA ativa, humano necessário, finalizado |

---

### 7. Lembretes Automáticos (Anti No-Show)

Sistema de lembretes em cascata para reduzir faltas.

#### Cronograma de Lembretes:

| Momento | Mensagem |
|---------|----------|
| **48 horas antes** | "Olá! Lembrando que sua consulta é em 2 dias..." |
| **24 horas antes** | "Sua consulta é amanhã às X horas. Confirma presença?" |
| **2 horas antes** | "Sua consulta é daqui a 2 horas. Nos vemos em breve!" |

#### Características:

- Mensagens personalizáveis
- Respeita horário comercial (não envia de madrugada)
- Registra todas as tentativas de contato
- Gera alerta se paciente não confirma

---

### 8. Pré-Check-in Digital

Coleta dados do paciente antes da consulta para agilizar atendimento.

#### Fluxo:

1. **24h antes:** Sistema envia link de pré-check-in via WhatsApp
2. **Paciente preenche:** Dados pessoais, convênio, documentos
3. **12h antes:** Lembrete se não completou
4. **Alerta para equipe:** Se continuar pendente

#### Dados Coletados:

- Confirmação/atualização de dados pessoais
- Informações de convênio
- Consentimentos necessários
- Questionário pré-consulta (se configurado)

---

### 9. Configurações do Sistema

Área para clínica personalizar funcionamento sem programação.

#### O que pode configurar:

| Configuração | Opções |
|--------------|--------|
| **Horário de funcionamento** | Abertura/fechamento por dia da semana |
| **Horário de almoço** | Início e fim do intervalo |
| **Serviços oferecidos** | Nome, duração, preço, ativo/inativo |
| **Antecedência mínima** | Tempo mínimo para agendar (ex: 2 horas) |
| **Usuários** | Criar, editar, ativar/desativar funcionários |
| **Permissões** | Admin (acesso total) ou Atendente (limitado) |

---

### 10. Analytics e Relatórios

Métricas e insights para tomada de decisão.

#### KPIs Disponíveis:

| Métrica | O que Mostra |
|---------|--------------|
| **Agendamentos do dia** | Quantas consultas hoje |
| **Taxa de confirmação** | % de consultas confirmadas vs. tentativas |
| **Conversas ativas** | Quantas conversas em andamento com IA |
| **Taxa de no-show** | % de faltas por período |
| **Alertas por tipo** | Distribuição de problemas |

#### Detecção de Padrões:

- **Horários problemáticos:** "Consultas às 15h têm mais faltas"
- **Profissionais com mais cancelamentos:** "Dr. João tem 20% mais cancelamentos"
- **Dias da semana:** "Segundas-feiras têm mais problemas"
- **Picos de alertas:** "Houve aumento de conversas travadas hoje"

#### Exportação:

- Download de dados em CSV
- Alertas, agendamentos, pacientes, métricas

---

## Diferenciais Competitivos

### vs. Agendamento Manual

| Aspecto | Manual | Botfy AI ClinicOps |
|---------|--------|-------------------|
| Confirmação | Ligar para cada paciente | Automático via WhatsApp |
| Disponibilidade | Horário comercial | 24/7 |
| Detecção de problemas | Quando paciente reclama | Tempo real |
| Preenchimento de vagas | Ligar para lista de espera | Automático |
| Histórico | Planilhas/papel | Centralizado e pesquisável |

### vs. Outros Sistemas de Agendamento

| Aspecto | Sistemas Tradicionais | Botfy AI ClinicOps |
|---------|----------------------|-------------------|
| IA no WhatsApp | ❌ Não tem | ✅ Assistente completa |
| Alertas inteligentes | ❌ Não tem | ✅ Priorização automática |
| Lista de espera | ⚠️ Manual | ✅ Preenchimento automático |
| Ações em 1 clique | ❌ Múltiplas telas | ✅ Resolve sem sair |
| Anti no-show | ⚠️ Básico | ✅ Cascata 48h/24h/2h |
| Detecção de padrões | ❌ Não tem | ✅ Analytics inteligente |

### Tecnologia de Ponta

- **IA Conversacional:** GPT-4 para respostas humanizadas
- **Tempo Real:** Alertas instantâneos via WebSocket
- **Mobile-Ready:** Console funciona em tablets
- **Cloud Native:** Sem instalação, acessa de qualquer lugar

---

## Benefícios por Público

### Para Donos de Clínica

| Benefício | Impacto |
|-----------|---------|
| **Redução de faltas** | +10-15% faturamento por melhor ocupação |
| **Menos funcionários em telefone** | Redução de custo operacional |
| **Visibilidade total** | Sabe o que acontece na clínica em tempo real |
| **Compliance** | Logs de auditoria para HIPAA/LGPD |
| **Escalabilidade** | Cresce de 1 para 10+ profissionais sem proporção de staff |

### Para Recepcionistas/Atendentes

| Benefício | Impacto |
|-----------|---------|
| **Menos ligações** | Foco em atendimento presencial |
| **Problemas destacados** | Não precisa monitorar tudo |
| **Resolve em 1 clique** | Menos navegação, mais agilidade |
| **Histórico na mão** | Sabe tudo do paciente ao atender |
| **Interface intuitiva** | Aprende em minutos |

### Para Profissionais de Saúde

| Benefício | Impacto |
|-----------|---------|
| **Agenda otimizada** | Menos buracos por cancelamentos |
| **Pacientes preparados** | Pré-check-in reduz tempo de consulta |
| **Menos no-shows** | Mais pacientes atendidos por dia |
| **Contexto do paciente** | Histórico completo disponível |

### Para Pacientes

| Benefício | Impacto |
|-----------|---------|
| **Agendamento 24/7** | Marca consulta quando quiser |
| **Resposta imediata** | IA responde em segundos |
| **Lembretes úteis** | Não esquece da consulta |
| **Flexibilidade** | Remarca pelo WhatsApp |
| **Atendimento humanizado** | IA conversa naturalmente |

---

## Comparativo: Antes vs. Depois

### Cenário: Segunda-feira típica em uma clínica

#### ANTES (Sem Botfy AI ClinicOps)

| Hora | Situação | Problema |
|------|----------|----------|
| 8:00 | Recepcionista chega | Lista de 25 pacientes para ligar e confirmar |
| 8:30 | Começam as ligações | Maioria não atende, caixa postal |
| 10:00 | Primeira consulta | Paciente não compareceu (não conseguiu confirmar) |
| 11:00 | Cancelamento | Recepcionista tenta preencher vaga, sem sucesso |
| 14:00 | Paciente com dúvida no WhatsApp | Demora 2h para ver e responder |
| 16:00 | Outro no-show | Perda de faturamento |
| 18:00 | Fim do dia | 3 faltas, 2 vagas não preenchidas, estresse da equipe |

**Resultado:** 5 horas em ligações, 3 faltas, R$ 600+ perdidos

#### DEPOIS (Com Botfy AI ClinicOps)

| Hora | Situação | Solução |
|------|----------|---------|
| 8:00 | Recepcionista chega | Dashboard mostra: 2 não confirmados, 1 conversa travada |
| 8:15 | Resolve alertas | 3 cliques: 1 intervenção WhatsApp, 1 ligação rápida, 1 limpa memória |
| 8:30 | Paciente agenda pelo WhatsApp | IA (Marília) atende automaticamente |
| 10:00 | Cancelamento de última hora | Sistema notifica lista de espera, vaga preenchida em 10 min |
| 12:00 | Lembretes automáticos | Sistema confirma 100% das consultas da tarde |
| 14:00 | Paciente com dúvida | IA responde em 30 segundos |
| 18:00 | Fim do dia | 1 falta (inevitável), agenda 95% ocupada, equipe tranquila |

**Resultado:** 30 min em alertas, 1 falta, R$ 400+ a mais faturado

---

## Especificações Técnicas

### Requisitos para Uso

| Requisito | Especificação |
|-----------|---------------|
| **Navegador** | Chrome, Firefox, Safari ou Edge (versões recentes) |
| **Resolução** | Mínimo 1280x720 (recomendado 1920x1080) |
| **Dispositivos** | Desktop, notebook, tablet (iPad Pro recomendado) |
| **Internet** | Conexão estável (mínimo 2 Mbps) |
| **WhatsApp** | Número comercial da clínica |

### Performance

| Métrica | Especificação |
|---------|---------------|
| **Busca de pacientes** | < 500ms |
| **Carregamento do calendário** | < 1 segundo |
| **Atualização de alertas** | Tempo real (WebSocket) |
| **Disponibilidade** | 99.9% uptime |

### Capacidade

| Recurso | Limite |
|---------|--------|
| **Pacientes** | Ilimitado |
| **Agendamentos** | Ilimitado |
| **Profissionais** | Até 50 por clínica |
| **Usuários do console** | Até 20 por clínica |
| **Histórico de conversas** | 2 anos |
| **Histórico de auditoria** | 6 anos |

---

## Integrações

### Integrações Nativas

| Sistema | Tipo | Status |
|---------|------|--------|
| **WhatsApp Business** | Mensagens | ✅ Integrado |
| **Supabase** | Banco de dados | ✅ Integrado |
| **N8N** | Automação | ✅ Integrado |
| **OpenAI GPT-4** | IA | ✅ Integrado |

### Integrações Futuras (Roadmap)

| Sistema | Tipo | Previsão |
|---------|------|----------|
| Google Calendar | Sincronização | v1.2 |
| Sistemas de prontuário | Dados clínicos | v1.3 |
| Gateway de pagamento | Cobrança | v1.4 |
| Sistemas contábeis | Faturamento | v1.5 |

### API para Desenvolvedores

- REST API completa
- Webhooks para eventos
- Documentação técnica disponível

---

## Segurança e Compliance

### Certificações e Conformidade

| Aspecto | Implementação |
|---------|---------------|
| **LGPD** | Consentimento, portabilidade, exclusão de dados |
| **HIPAA** | Logs de auditoria 6 anos, criptografia, acesso controlado |
| **OWASP Top 10** | Proteção contra vulnerabilidades comuns |

### Controle de Acesso

| Recurso | Descrição |
|---------|-----------|
| **Autenticação** | Email/senha com validação forte |
| **Roles** | Admin (acesso total) e Atendente (limitado) |
| **Timeout** | Sessão expira após 30 min inativo |
| **RLS** | Dados isolados por clínica |
| **Auditoria** | Todas ações registradas |

### Proteção de Dados

| Camada | Proteção |
|--------|----------|
| **Em trânsito** | HTTPS/TLS 1.3 |
| **Em repouso** | Criptografia AES-256 |
| **Backups** | Diários com retenção 30 dias |
| **Logs sensíveis** | Nunca contêm dados de pacientes |

---

## Planos e Roadmap

### Versão Atual: v1.0 (Janeiro 2026)

**Funcionalidades completas:**
- ✅ Central de Alertas inteligente
- ✅ Calendário visual multi-profissional
- ✅ Gestão completa de pacientes
- ✅ Assistente IA no WhatsApp
- ✅ Lista de espera com preenchimento automático
- ✅ Lembretes anti no-show (48h/24h/2h)
- ✅ Pré-check-in digital
- ✅ Analytics e detecção de padrões
- ✅ Configurações self-service
- ✅ Auditoria HIPAA/LGPD

### Próximas Versões

#### v1.1 (Previsão: Q1 2026)
- Autenticação de dois fatores (2FA)
- Machine Learning para previsão de no-show
- Resolução em lote de alertas
- Reset de senha pelo usuário

#### v1.2 (Previsão: Q2 2026)
- Arrastar e soltar no calendário
- Sincronização Google Calendar
- App móvel nativo

#### v1.3 (Previsão: Q3 2026)
- Suporte multi-clínica
- Integração com prontuários eletrônicos
- Roles customizáveis

#### v2.0 (Previsão: Q4 2026)
- Módulo financeiro completo
- Integração SMS
- Telemedicina integrada

---

## FAQ para Vendas

### Perguntas Frequentes

#### Instalação e Setup

**P: Precisa instalar algo?**
R: Não. É 100% na nuvem, acessa pelo navegador.

**P: Quanto tempo leva para implantar?**
R: Configuração inicial em 1-2 dias. Equipe operando em 1 semana.

**P: Funciona com meu WhatsApp atual?**
R: Usamos WhatsApp Business API. Precisamos de um número dedicado para a clínica.

**P: Preciso trocar meu sistema atual?**
R: Não necessariamente. Podemos operar em paralelo ou substituir gradualmente.

#### Funcionalidades

**P: A IA responde igual humano?**
R: Usamos GPT-4 da OpenAI. As respostas são naturais e personalizáveis para sua clínica.

**P: O que acontece se a IA não souber responder?**
R: Sistema gera alerta para sua equipe intervir. Vocês são notificados em tempo real.

**P: Funciona fora do horário comercial?**
R: A IA atende 24/7. Equipe pode resolver alertas no horário que preferir.

**P: Quantos profissionais suporta?**
R: Até 50 profissionais por clínica, cada um com agenda própria.

#### Segurança

**P: Os dados dos pacientes estão seguros?**
R: Sim. Criptografia, controle de acesso, logs de auditoria. Compliance LGPD e HIPAA.

**P: Onde ficam os dados?**
R: Servidores no Brasil (Supabase), com backup diário.

**P: Quem tem acesso aos dados?**
R: Apenas usuários autorizados da clínica. Temos RLS (Row Level Security) isolando dados.

#### Preço e Contrato

**P: Qual o modelo de cobrança?**
R: Mensalidade fixa por clínica, baseada em número de profissionais.

**P: Tem período mínimo de contrato?**
R: Mínimo 12 meses no plano anual, ou mensal com aviso de 30 dias.

**P: Inclui suporte?**
R: Sim. Suporte por chat/email incluído. Suporte premium disponível.

### Objeções Comuns e Respostas

#### "Minha equipe não vai se adaptar"

> "O sistema foi desenhado para ser intuitivo. A interface é similar ao WhatsApp que todos conhecem. Treinamento inicial leva menos de 1 hora, e a equipe geralmente domina em 1 semana."

#### "Já tentei sistema de agendamento e não funcionou"

> "Sistemas tradicionais são passivos - só mostram agenda. O Botfy é ativo: a IA agenda, confirma, lembra. Sua equipe só atua quando realmente precisa. É como ter uma secretária extra 24 horas."

#### "Pacientes não vão querer falar com robô"

> "Nossa IA usa linguagem natural, muitos pacientes nem percebem que é automático. E sempre que o paciente quiser, pode pedir para falar com humano - o sistema direciona automaticamente."

#### "Parece caro"

> "Vamos fazer uma conta: se você reduz faltas de 15% para 5%, em uma clínica com 20 consultas/dia a R$150 média, são R$4.500/mês a mais de faturamento. O sistema se paga várias vezes."

#### "E se o sistema cair?"

> "Temos 99.9% de uptime garantido. Se houver qualquer problema, sua equipe pode atender normalmente pelo WhatsApp - só as automações pausam temporariamente."

---

## Materiais de Apoio

### Para Apresentações

- Deck de apresentação (slides)
- Vídeo demo (3 minutos)
- Case studies de clínicas similares
- Calculadora de ROI

### Para Propostas

- Template de proposta comercial
- Tabela de preços por perfil
- Comparativo com concorrentes
- Cronograma de implantação

### Para Treinamento

- Guia rápido do usuário
- Vídeos tutoriais por funcionalidade
- FAQ técnico
- Documentação completa

---

## Glossário

| Termo | Significado |
|-------|-------------|
| **Alerta** | Notificação de algo que precisa atenção da equipe |
| **Conversa travada** | IA não consegue ajudar o paciente, precisa intervenção |
| **Handoff** | Transferência de conversa da IA para humano |
| **No-show** | Paciente que faltou à consulta sem avisar |
| **Pré-check-in** | Coleta de dados do paciente antes da consulta |
| **Lista de espera** | Fila de pacientes querendo horário que está ocupado |
| **RLS** | Row Level Security - isolamento de dados por clínica |
| **Tentativo** | Consulta marcada mas não confirmada |

---

## Contato Interno

**Dúvidas sobre funcionalidades:** [equipe técnica]
**Materiais de marketing:** [equipe marketing]
**Propostas comerciais:** [equipe vendas]
**Suporte a cliente:** [equipe CS]

---

*Documento atualizado em Janeiro 2026*
*Versão do produto: 1.0*
*Para uso interno - Equipe de Marketing e Vendas*
