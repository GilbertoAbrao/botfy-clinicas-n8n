# Phase 5: Conversation Monitoring - Context

**Gathered:** 2026-01-17
**Status:** Ready for planning

<vision>
## How This Should Work

Um painel de conversas ativas mostrando todas as conversas em andamento com a clínica. A equipe abre o painel e vê cards expandíveis - cada card mostra um resumo da conversa (paciente, status IA/Humano/Finalizado, última mensagem, tempo desde última interação).

Quando precisa ver mais detalhes, expande o card e vê o histórico completo da conversa no estilo WhatsApp - balões de mensagem (verde para paciente, branco para clínica/IA), timestamps em cada mensagem, e indicadores de status de entrega (enviado/entregue/lido/falhou).

É fácil identificar visualmente quais mensagens foram enviadas pela IA vs por um humano. Quando a IA trava em loop, tem um botão claro para limpar a memória do chat e resolver o problema.

O painel mostra conversas acontecendo em tempo real - quando chega nova mensagem, aparece sem precisar dar refresh.

</vision>

<essential>
## What Must Be Nailed

- **Ver o que a IA disse** - Distinguir claramente mensagens da IA vs mensagens humanas, entender exatamente o que foi respondido ao paciente
- **Resolver loops rapidamente** - Botão de "Limpar Memória" fácil de encontrar quando a IA trava, sem precisar navegar para outro lugar
- **Monitorar em tempo real** - Conversas atualizando ao vivo, saber quando precisa intervir antes que vire problema

</essential>

<specifics>
## Specific Ideas

- **Estilo WhatsApp** - Balões de mensagem verde/branco, familiar para a equipe
- **Cards expandíveis** - Lista compacta que expande para mostrar histórico completo
- **Timestamps visíveis** - Horário em cada mensagem
- **Status de entrega** - Indicadores visuais (enviado/entregue/lido/falhou)
- **Distinção IA/Humano** - Ícone ou badge indicando quem enviou cada mensagem

</specifics>

<notes>
## Additional Context

A equipe já está acostumada com WhatsApp, então manter a interface familiar reduz curva de aprendizado.

O acesso às conversas também deve estar disponível:
- Do perfil do paciente (ver histórico de comunicação)
- Da view de alertas (entender o que causou o alerta)

A funcionalidade de limpar memória (n8n_chat_histories) é crítica para resolver situações onde a IA entra em loop ou fica confusa com o contexto.

</notes>

---

*Phase: 05-conversation-monitoring*
*Context gathered: 2026-01-17*
