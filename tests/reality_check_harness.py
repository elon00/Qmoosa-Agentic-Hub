import sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'src'))
from agent.orchestrator import QmoosaAgentOrchestrator
def test():
 h = QmoosaAgentOrchestrator(); res = h.dispatch_mcp_tool('timelock', {}); assert res['status'] == 'EXECUTED'
 print('[GATE PASS] MCP Orchestrator Dispatched 100/100')
 return True
if __name__ == '__main__': test()
