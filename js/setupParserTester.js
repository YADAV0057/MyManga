// js/setupParserTester.js

export function setupParserTester() {

    const btn = document.getElementById("parser-test-btn");
    const input = document.getElementById("parser-input");
    const output = document.getElementById("parser-output");

    if (!btn || !input || !output) {
        console.warn("Parser UI missing");
        return;
    }

    btn.addEventListener("click", async () => {

        const raw = input.value.trim();

        if (!raw) {
            output.innerHTML = `
                <div style="color:#ffcc00">
                    ⚠️ Enter some text first
                </div>
            `;
            return;
        }

        try {
            // 1. Let pipeline.js do ALL the heavy lifting
            const pipelineModule = await import("./parser/pipeline.js");
            const intent = pipelineModule.buildIntent(raw);

            
                       // 2. Build Visual Bars for Mood Profile
            let profileHTML = "<div style='opacity: 0.5;'>No specific moods detected. Try different words!</div>";
            
            if (intent && intent.moodProfile && intent.moodProfile.length > 0) {
                profileHTML = intent.moodProfile.map(m => `
                    <div style="margin-bottom: 12px;">
                        <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 4px; font-weight: 600;">
                            <span style="text-transform: capitalize;">${m.name}</span>
                            <span style="color: #00ff9d;">${m.percent}%</span>
                        </div>
                        <div style="width: 100%; background: rgba(255, 255, 255, 0.1); border-radius: 6px; overflow: hidden; height: 8px;">
                            <div style="width: ${m.percent}%; background: #00ff9d; height: 100%; border-radius: 6px; transition: width 0.4s ease-out;"></div>
                        </div>
                    </div>
                `).join('');
            }
 
            // 5. Render Output Dashboard
            output.innerHTML = `
                <div style="line-height:1.7; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px;">

                    <h3 style="margin-top: 0;">📝 Original Input</h3>
                    <div style="opacity: 0.8; font-style: italic;">"${intent.originalQuery}"</div>

                    <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">

                    <h3>🎭 Dynamic Mood Profile</h3>
                    <div style="margin-top: 15px;">
                        ${profileHTML}
                    </div>

                    <div style="margin-top: 15px; font-size: 12px; text-align: right;">
                        <span style="opacity: 0.6;">Global Intensity:</span> 
                        <strong style="color: #00ff9d;">${intent.intensity ? intent.intensity.toFixed(2) : "0.00"}</strong>
                        &nbsp;|&nbsp;
                        <span style="opacity: 0.6;">Calculated Tone:</span> 
                        <strong style="color: #00e5ff; text-transform: capitalize;">${intent.tone}</strong>
                    </div>

                    <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">

                    <h3>⚙️ Hard Constraints (Rules)</h3>
                    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; margin-top: 10px;">
                        <div style="margin-bottom: 8px;">
                            <strong style="color: #00ff9d;">Status:</strong> <span style="text-transform: capitalize;">${intent.status || "<span style='opacity:0.5'>Any</span>"}</span>
                        </div>
                        <div style="margin-bottom: 8px;">
                            <strong style="color: #00ff9d;">Sorting:</strong> <span style="text-transform: capitalize;">${intent.sort}</span>
                        </div>
                        <div>
                            <strong style="color: #00ff9d;">Max Chapters:</strong> ${intent.maxChapters ? intent.maxChapters : "<span style='opacity:0.5'>No limit</span>"}
                        </div>
                    </div>

                    <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">

                    <h3>🎯 Primary Intent (Must Haves)</h3>
                    <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; margin-top: 10px;">
                        <div style="margin-bottom: 8px;">
                            <strong style="color: #ffcc00;">Genres:</strong> 
                            ${intent.genres?.length ? intent.genres.map(g => `${g.name} <span style="opacity:0.6">(${Math.round(g.confidence * 100)}%)</span>`).join(", ") : "<span style='opacity:0.5'>None</span>"}
                        </div>
                        <div style="margin-bottom: 8px;">
                            <strong style="color: #ff9d00;">Themes:</strong> 
                            ${intent.themes?.length ? intent.themes.map(t => `${t.name} <span style="opacity:0.6">(${Math.round(t.confidence * 100)}%)</span>`).join(", ") : "<span style='opacity:0.5'>None</span>"}
                        </div>
                        <div>
                            <strong style="color: #ff007b;">Demographics:</strong> 
                            ${intent.demographics?.length ? intent.demographics.map(d => `${d.name} <span style="opacity:0.6">(${Math.round(d.confidence * 100)}%)</span>`).join(", ") : "<span style='opacity:0.5'>None</span>"}
                        </div>
                    </div>

                    <hr style="border-color: rgba(255,255,255,0.1); margin: 15px 0;">

                    <h3>🚀 Inferred Intent & Routing</h3>
                    <div style="background: rgba(255, 255, 255, 0.05); border-left: 4px solid #00e5ff; padding: 10px; border-radius: 4px; margin-top: 10px;">
                        
                        <div style="margin-bottom: 12px;">
                            <strong style="color: #00ff9d;">💡 Suggested Additions:</strong> 
                            <div style="padding-left: 10px; font-size: 13px; opacity: 0.9; margin-top: 4px;">
                                <span style="opacity:0.7">Genres:</span> ${intent.boosts?.genres?.length ? intent.boosts.genres.map(g => `${g.name} (${Math.round(g.score * 100)}%)`).join(", ") : "None"}<br>
                                <span style="opacity:0.7">Themes:</span> ${intent.boosts?.themes?.length ? intent.boosts.themes.map(t => `${t.name} (${Math.round(t.score * 100)}%)`).join(", ") : "None"}
                            </div>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <strong style="color: #ff4b4b;">🚫 Excluded (Avoid):</strong> 
                            <div style="padding-left: 10px; font-size: 13px; opacity: 0.9; margin-top: 4px;">
                                <span style="opacity:0.7">Genres:</span> ${intent.avoids?.genres?.length ? intent.avoids.genres.join(", ") : "None"}<br>
                                <span style="opacity:0.7">Themes:</span> ${intent.avoids?.themes?.length ? intent.avoids.themes.join(", ") : "None"}
                            </div>
                        </div>

                        <div style="margin-bottom: 12px;">
                            <strong style="color: #ffcc00;">🔌 API Waterfall Route:</strong> 
                            <span style="font-size: 13px;">${intent.searchPriority ? intent.searchPriority.join(" → ") : "Default"}</span>
                        </div>
                        
                                              <div>
                            <strong style="color: #b388ff;">🤖 AI Confidence: ${(intent.confidence * 100).toFixed(0)}%</strong> 
                            <ul style="margin: 4px 0 0 0; padding-left: 16px; font-size: 12px; opacity: 0.8; list-style-type: '• ';">
                                ${intent.ruleLogs?.length 
                                    ? intent.ruleLogs.map(log => `<li>${log}</li>`).join('') 
                                    : "<li>No specific rules triggered</li>"}
                            </ul>
                        </div>
  
                    </div>
                </div>
            `;
            
        } catch (err) {
            console.error("Parser Error:", err);
            output.innerHTML = `
                <div style="color:red">
                    ❌ Error in parser pipeline:
                    <br><br>
                    ${err.message}
                </div>
            `;
        }
    });

    if (window.AppDiagnostics) {
        window.AppDiagnostics.log("Parser", true, "Tester initialized with pipeline.js");
    }
}
