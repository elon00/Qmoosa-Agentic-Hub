export type AgentTaskTrigger = "cell_spawn" | "epoch_milestone" | "pattern_detected" | "entropy_shift";

export interface AgentTaskEvent {
  generation: number;
  triggerType: AgentTaskTrigger;
  activeCells: number;
  coordinates?: { x: number; y: number };
  payload: Record<string, unknown>;
}

/**
 * Conway Automaton Simulation & Agent Task Dispatcher.
 * Translates Conway Game of Life states into deterministic triggers
 * for multi-agent workflows and on-chain oracle verification.
 */
export class ConwayAutomatonEngine {
  public width: number;
  public height: number;
  public grid: boolean[][];
  public generation: number = 0;
  private taskListeners: ((event: AgentTaskEvent) => void)[] = [];

  constructor(width = 32, height = 32) {
    this.width = width;
    this.height = height;
    this.grid = this.initGrid();
  }

  private initGrid(): boolean[][] {
    return Array.from({ length: this.height }, () => Array(this.width).fill(false));
  }

  /**
   * Seed the grid with a glider or random alive cells
   */
  public seedGlider(startX = 1, startY = 1): void {
    const coords = [
      [startX + 1, startY],
      [startX + 2, startY + 1],
      [startX, startY + 2],
      [startX + 1, startY + 2],
      [startX + 2, startY + 2],
    ];
    coords.forEach(([x, y]) => {
      if (y < this.height && x < this.width) {
        this.grid[y][x] = true;
      }
    });
  }

  public onAgentTask(listener: (event: AgentTaskEvent) => void): void {
    this.taskListeners.push(listener);
  }

  /**
   * Run one epoch/generation of Conway's Game of Life (B3/S23)
   */
  public step(): void {
    const nextGrid = this.initGrid();
    let activeCount = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const neighbors = this.countNeighbors(x, y);
        const alive = this.grid[y][x];

        // Conway rules:
        // 1. Any live cell with 2 or 3 live neighbors survives.
        // 2. Any dead cell with exactly 3 live neighbors becomes a live cell.
        if (alive && (neighbors === 2 || neighbors === 3)) {
          nextGrid[y][x] = true;
          activeCount++;
        } else if (!alive && neighbors === 3) {
          nextGrid[y][x] = true;
          activeCount++;
          // Trigger task on cell birth
          this.emitTask({
            generation: this.generation + 1,
            triggerType: "cell_spawn",
            activeCells: activeCount,
            coordinates: { x, y },
            payload: { message: `New agent cell spawned at [${x}, ${y}]` },
          });
        }
      }
    }

    this.grid = nextGrid;
    this.generation++;

    if (this.generation % 10 === 0) {
      this.emitTask({
        generation: this.generation,
        triggerType: "epoch_milestone",
        activeCells: activeCount,
        payload: { status: "Epoch checkpoint reached", epoch: this.generation / 10 },
      });
    }
  }

  private countNeighbors(x: number, y: number): number {
    let count = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = (x + dx + this.width) % this.width;
        const ny = (y + dy + this.height) % this.height;
        if (this.grid[ny][nx]) count++;
      }
    }
    return count;
  }

  private emitTask(event: AgentTaskEvent): void {
    this.taskListeners.forEach((listener) => listener(event));
  }
}
