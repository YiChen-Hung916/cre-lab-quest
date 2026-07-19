
const BossEngine = {
  mount(ctx) {
    /*
     * Level 20 已改由 TrainingGames 的 boss20 模式處理。
     * BossEngine 僅負責 Level 35、50、65...等後續綜合 Boss。
     */
    if (ctx.config.level === 20 || ctx.config.mode === "boss20") {
      if (
        typeof TrainingGames === "undefined" ||
        typeof TrainingGames.mount !== "function"
      ) {
        throw new Error(
          "Level 20 requires TrainingGames.mount()."
        );
      }

      TrainingGames.mount(ctx);
      return;
    }

    const count = Number(ctx.config.rounds) || 3;

    const trainingPool = [
      "pipette",
      "centrifuge",
      "plate",
      "microscope"
    ];

    const futurePool = seededShuffle(
      FUTURE_MODE_IDS,
      ctx.config.level + Date.now()
    );

    const modes = [];

    modes.push(
      trainingPool[
        ctx.config.level % trainingPool.length
      ]
    );

    if (count >= 4) {
      modes.push(
        trainingPool[
          (ctx.config.level + 1) %
          trainingPool.length
        ]
      );
    }

    modes.push(
      ...futurePool.slice(
        0,
        count - modes.length
      )
    );

    let round = 0;

    const render = () => {
      if (round >= count) {
        ctx.complete();
        return;
      }

      ctx.stage.innerHTML = `
        <div class="game-shell">
          <div class="game-instructions">
            <span class="kicker">
              BOSS ROUND ${round + 1}/${count}
            </span>

            <h3>${modes[round]}</h3>

            <p>
              Boss 無檢查點。完成所有回合才可過關。
            </p>
          </div>

          <div class="controls">
            ${Array.from(
              { length: count },
              (_, index) => `
                <span
                  class="boss-tag"
                  style="
                    background:
                    ${
                      index < round
                        ? "#2f8f83"
                        : index === round
                          ? "#e6aa42"
                          : "#c8d6dc"
                    }
                  "
                >
                  ${index + 1}
                </span>
              `
            ).join("")}
          </div>

          <div class="event-card">
            <p>
              此 Boss 關卡尚未掛載正式遊戲模式。
            </p>

            <div class="controls">
              <button
                id="bossPass"
                class="btn btn-primary"
                type="button"
              >
                完成本回合
              </button>

              <button
                id="bossFail"
                class="btn btn-soft"
                type="button"
              >
                模擬重大事故
              </button>
            </div>
          </div>
        </div>
      `;

      ctx.stage
        .querySelector("#bossPass")
        ?.addEventListener("click", () => {
          round++;
          render();
        });

      ctx.stage
        .querySelector("#bossFail")
        ?.addEventListener("click", () => {
          ctx.penalize(
            "safety",
            45,
            "Boss 回合發生重大事故。"
          );
        });
    };

    render();
  }
};

