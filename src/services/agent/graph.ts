import { StateGraph, Annotation, START, END } from '@langchain/langgraph'
import { agentNode, toolNode, shouldContinue, type GraphState } from './nodes'

const AgentState = Annotation.Root({
  messages: Annotation<Array<any>>({
    reducer: (_, update) => update,
    default: () => [],
  }),
  documentContent: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  documentTitle: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  selection: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  cursorPosition: Annotation<number>({
    reducer: (_, update) => update,
    default: () => 0,
  }),
  memory: Annotation<string>({
    reducer: (_, update) => update,
    default: () => '',
  }),
  pendingReview: Annotation<boolean>({
    reducer: (_, update) => update,
    default: () => false,
  }),
  pendingToolCalls: Annotation<Array<{ id: string; name: string; args: Record<string, any> }>>({
    reducer: (_, update) => update,
    default: () => [],
  }),
})

function reviewNode(state: GraphState): Partial<GraphState> {
  return {
    pendingReview: true,
    pendingToolCalls: state.pendingToolCalls,
  }
}

const graph = new StateGraph(AgentState)
  .addNode('agent', agentNode)
  .addNode('tools', toolNode)
  .addNode('review', reviewNode)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue, {
    tools: 'tools',
    review: 'review',
    [END]: END,
  })
  .addEdge('tools', 'agent')
  .addEdge('review', END)

export const compiledGraph = graph.compile()

export type CompiledGraph = typeof compiledGraph
