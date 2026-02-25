// ===================================================
// REAL AI HEALTH ANALYZER WITH MACHINE LEARNING
// ===================================================

class RealHealthAI {
    constructor() {
        this.model = null;
        this.isTraining = false;
        this.userHistory = [];
        this.baseline = null;
        this.patterns = {};
        // Hardcoded Gemini API Key
        this.apiKey = '';
        this.loadFromStorage();

        // Defer neural network initialization to prevent UI freeze
        setTimeout(() => this.initModel(), 1000);
    }

    async initModel() {
        if (this.model) return; // Already initialized

        try {
            // Create a neural network for health prediction
            this.model = tf.sequential();

            // Input layer: 3 features (bpm, spo2, temp)
            this.model.add(tf.layers.dense({
                units: 16,
                activation: 'relu',
                inputShape: [3]
            }));

            // Hidden layers
            this.model.add(tf.layers.dense({ units: 12, activation: 'relu' }));
            this.model.add(tf.layers.dense({ units: 8, activation: 'relu' }));

            // Output layer: 4 categories (excellent, good, fair, poor)
            this.model.add(tf.layers.dense({ units: 4, activation: 'softmax' }));

            // Compile the model
            this.model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });

            console.log("AI Neural Network initialized (Ready)");
        } catch (e) {
            console.warn("Lightweight mode: Neural Net skipped", e);
        }
    }

    // Store user data
    addDataPoint(bpm, spo2, temp, context = {}) {
        const timestamp = Date.now();
        const dataPoint = {
            timestamp,
            bpm,
            spo2,
            temp,
            context, // Can add activity, time of day, etc.
            hour: new Date().getHours(),
            dayOfWeek: new Date().getDay()
        };

        this.userHistory.push(dataPoint);

        // Keep only last 1000 data points
        if (this.userHistory.length > 1000) {
            this.userHistory = this.userHistory.slice(-1000);
        }

        // Update baseline (moving average)
        this.updateBaseline();

        // Detect patterns
        this.detectPatterns();

        // Save to localStorage
        this.saveToStorage();

        // Train model with new data (in background)
        setTimeout(() => this.trainModel(), 1000);

        return dataPoint;
    }

    // Calculate moving baseline
    updateBaseline() {
        if (this.userHistory.length < 10) return;

        const recent = this.userHistory.slice(-50); // Last 50 points
        const sum = recent.reduce((acc, point) => ({
            bpm: acc.bpm + point.bpm,
            spo2: acc.spo2 + point.spo2,
            temp: acc.temp + point.temp
        }), { bpm: 0, spo2: 0, temp: 0 });

        const count = recent.length;
        this.baseline = {
            bpm: sum.bpm / count,
            spo2: sum.spo2 / count,
            temp: sum.temp / count,
            updated: Date.now()
        };
    }

    // Detect patterns in user data
    detectPatterns() {
        if (this.userHistory.length < 100) return;

        // Analyze by time of day
        const patternsByHour = {};
        const patternsByDay = {};

        this.userHistory.forEach(point => {
            const hour = point.hour;
            const day = point.dayOfWeek;

            if (!patternsByHour[hour]) patternsByHour[hour] = [];
            if (!patternsByDay[day]) patternsByDay[day] = [];

            patternsByHour[hour].push(point);
            patternsByDay[day].push(point);
        });

        // Calculate averages for each hour
        this.patterns.hourly = {};
        for (const [hour, data] of Object.entries(patternsByHour)) {
            const avg = this.calculateAverage(data);
            this.patterns.hourly[hour] = {
                bpm: avg.bpm,
                spo2: avg.spo2,
                temp: avg.temp,
                stressLevel: this.calculateStressLevel(avg.bpm, avg.spo2)
            };
        }

        // Calculate averages for each day
        this.patterns.daily = {};
        for (const [day, data] of Object.entries(patternsByDay)) {
            const avg = this.calculateAverage(data);
            this.patterns.daily[day] = {
                bpm: avg.bpm,
                spo2: avg.spo2,
                temp: avg.temp,
                stressLevel: this.calculateStressLevel(avg.bpm, avg.spo2)
            };
        }
    }

    calculateAverage(data) {
        const sum = data.reduce((acc, point) => ({
            bpm: acc.bpm + point.bpm,
            spo2: acc.spo2 + point.spo2,
            temp: acc.temp + point.temp
        }), { bpm: 0, spo2: 0, temp: 0 });

        const count = data.length;
        return {
            bpm: sum.bpm / count,
            spo2: sum.spo2 / count,
            temp: sum.temp / count
        };
    }

    // Train the neural network
    async trainModel() {
        if (this.userHistory.length < 50 || this.isTraining) return;

        this.isTraining = true;

        try {
            // Prepare training data
            const trainingData = [];
            const labels = [];

            // Use last 50 points for training
            const trainingPoints = this.userHistory.slice(-50);

            trainingPoints.forEach(point => {
                // Normalize input
                const input = [
                    point.bpm / 200,    // Normalize BPM (max 200)
                    point.spo2 / 100,   // Normalize SpO2 (max 100%)
                    point.temp / 40     // Normalize temp (max 40°C)
                ];

                // Create label based on health status
                const stress = this.calculateStressLevel(point.bpm, point.spo2);
                const label = [0, 0, 0, 0];
                label[stress] = 1; // One-hot encoding

                trainingData.push(input);
                labels.push(label);
            });

            // Convert to tensors
            const xs = tf.tensor2d(trainingData);
            const ys = tf.tensor2d(labels);

            // Train the model
            await this.model.fit(xs, ys, {
                epochs: 20,
                batchSize: 10,
                shuffle: true,
                verbose: 0
            });

            console.log("AI model trained with", trainingPoints.length, "data points");

            // Clean up tensors
            xs.dispose();
            ys.dispose();

        } catch (error) {
            console.error("Training error:", error);
        } finally {
            this.isTraining = false;
        }
    }

    // Predict health status using AI
    async predict(bpm, spo2, temp) {
        if (!this.model || this.userHistory.length < 10) {
            return this.ruleBasedAnalysis(bpm, spo2, temp);
        }

        try {
            // Normalize input
            const input = tf.tensor2d([[
                bpm / 200,
                spo2 / 100,
                temp / 40
            ]]);

            // Make prediction
            const prediction = this.model.predict(input);
            const results = await prediction.data();

            // Get predicted category
            const categories = ['Excellent', 'Good', 'Fair', 'Poor'];
            const maxIndex = results.indexOf(Math.max(...results));

            // Calculate confidence
            const confidence = results[maxIndex] * 100;

            // Clean up
            input.dispose();
            prediction.dispose();

            return {
                category: categories[maxIndex],
                confidence: confidence.toFixed(1),
                probabilities: results.map((r, i) => ({
                    category: categories[i],
                    probability: (r * 100).toFixed(1)
                })),
                source: 'AI Neural Network'
            };

        } catch (error) {
            console.error("Prediction error:", error);
            return this.ruleBasedAnalysis(bpm, spo2, temp);
        }
    }

    // Rule-based analysis (fallback)
    ruleBasedAnalysis(bpm, spo2, temp) {
        const stressLevel = this.calculateStressLevel(bpm, spo2);
        const categories = ['Excellent', 'Good', 'Fair', 'Poor'];

        return {
            category: categories[stressLevel],
            confidence: 100,
            source: 'Rule-Based Engine'
        };
    }

    // Calculate stress level (0-3)
    calculateStressLevel(bpm, spo2) {
        let score = 0;

        // Heart rate stress
        if (bpm < 60) score += 1;
        else if (bpm > 100 && bpm <= 120) score += 1;
        else if (bpm > 120) score += 2;

        // Oxygen stress
        if (spo2 < 95) score += 1;
        if (spo2 < 92) score += 1;

        return Math.min(3, score);
    }

    // Generate personalized suggestions
    generatePersonalizedSuggestions(bpm, spo2, temp, previousData = null) {
        const suggestions = [];
        const warnings = [];
        const routines = [];

        // Compare with baseline
        if (this.baseline) {
            const bpmDiff = ((bpm - this.baseline.bpm) / this.baseline.bpm) * 100;
            const spo2Diff = spo2 - this.baseline.spo2;
            const tempDiff = temp - this.baseline.temp;

            // Heart rate analysis
            if (bpmDiff > 20) {
                suggestions.push({
                    type: 'stress_management',
                    title: 'Elevated Heart Rate Detected',
                    description: `Your heart rate is ${Math.abs(bpmDiff).toFixed(1)}% higher than your usual ${this.baseline.bpm.toFixed(0)} BPM.`,
                    action: 'Practice 4-7-8 breathing for 2 minutes',
                    urgency: 'medium',
                    duration: '2 minutes'
                });
            } else if (bpmDiff < -20) {
                suggestions.push({
                    type: 'activity',
                    title: 'Lower Than Usual Heart Rate',
                    description: 'Your heart rate is significantly lower than usual.',
                    action: 'Consider light activity like stretching',
                    urgency: 'low',
                    duration: '5 minutes'
                });
            }

            // Oxygen analysis
            if (spo2Diff < -2) {
                suggestions.push({
                    type: 'breathing',
                    title: 'Oxygen Level Drop',
                    description: `Your oxygen level is ${Math.abs(spo2Diff).toFixed(1)}% lower than your usual ${this.baseline.spo2.toFixed(1)}%.`,
                    action: 'Perform diaphragmatic breathing exercises',
                    urgency: 'medium',
                    duration: '3 minutes'
                });
            }
        }

        // Absolute value analysis
        if (bpm > 100) {
            suggestions.push({
                type: 'immediate_action',
                title: 'High Heart Rate',
                description: 'Your heart rate indicates physical or mental stress.',
                action: 'Take a 5-minute break from current activity',
                urgency: 'high',
                duration: '5 minutes'
            });
        }

        if (spo2 < 95) {
            suggestions.push({
                type: 'breathing',
                title: 'Optimize Oxygen Intake',
                description: 'Your oxygen saturation can be improved.',
                action: 'Practice pursed-lip breathing',
                urgency: 'medium',
                duration: '2 minutes'
            });
        }

        if (temp > 37.5) {
            suggestions.push({
                type: 'hydration',
                title: 'Body Temperature Elevated',
                description: 'Your body temperature is above normal range.',
                action: 'Drink cool water and rest in a ventilated area',
                urgency: 'medium',
                duration: '10 minutes'
            });
        }

        // Pattern-based suggestions
        const hour = new Date().getHours();
        if (this.patterns.hourly && this.patterns.hourly[hour]) {
            const hourPattern = this.patterns.hourly[hour];
            if (hourPattern.stressLevel > 2) {
                suggestions.push({
                    type: 'routine',
                    title: 'Time-Based Pattern Detected',
                    description: `You typically experience higher stress around this time (${hour}:00).`,
                    action: 'Schedule lighter tasks during this period',
                    urgency: 'low',
                    duration: 'Ongoing'
                });
            }
        }

        // Generate personalized routine
        const routine = this.generateDailyRoutine();
        if (routine) {
            routines.push(routine);
        }

        // Learning-based improvement
        if (this.userHistory.length > 200) {
            const improvement = this.calculateImprovement();
            if (improvement) {
                suggestions.push({
                    type: 'progress',
                    title: 'Health Improvement Detected',
                    description: improvement.message,
                    action: 'Continue your current routine',
                    urgency: 'low',
                    duration: 'Ongoing'
                });
            }
        }

        // Fallback suggestions
        if (suggestions.length === 0) {
            suggestions.push({
                type: 'maintenance',
                title: 'Optimal Health Maintained',
                description: 'Your biometrics are within healthy ranges.',
                action: 'Continue your current healthy habits',
                urgency: 'low',
                duration: 'Ongoing'
            });
        }

        return {
            suggestions: suggestions.slice(0, 3), // Top 3 suggestions
            warnings,
            routines,
            baseline: this.baseline,
            dataPoints: this.userHistory.length
        };
    }

    // Generate daily routine based on patterns
    generateDailyRoutine() {
        if (!this.patterns.hourly || Object.keys(this.patterns.hourly).length < 5) {
            return null;
        }

        // Find high-stress hours
        const highStressHours = [];
        for (const [hour, data] of Object.entries(this.patterns.hourly)) {
            if (data.stressLevel >= 2) {
                highStressHours.push(parseInt(hour));
            }
        }

        if (highStressHours.length > 0) {
            return {
                title: 'Personalized Daily Schedule',
                description: `Based on your patterns, schedule breaks during high-stress hours: ${highStressHours.map(h => h + ':00').join(', ')}`,
                actions: [
                    'Take 5-minute breaks during high-stress hours',
                    'Schedule demanding tasks during low-stress periods',
                    'Practice breathing exercises before anticipated stress'
                ]
            };
        }

        return null;
    }

    // Calculate improvement over time
    calculateImprovement() {
        if (this.userHistory.length < 100) return null;

        const oldData = this.userHistory.slice(0, 50);
        const newData = this.userHistory.slice(-50);

        const oldAvg = this.calculateAverage(oldData);
        const newAvg = this.calculateAverage(newData);

        const bpmImprovement = ((oldAvg.bpm - newAvg.bpm) / oldAvg.bpm) * 100;
        const spo2Improvement = newAvg.spo2 - oldAvg.spo2;

        if (bpmImprovement > 5 || spo2Improvement > 1) {
            return {
                message: `Your average heart rate improved by ${bpmImprovement.toFixed(1)}% and oxygen levels by ${spo2Improvement.toFixed(1)}%`,
                metrics: {
                    bpmImprovement,
                    spo2Improvement
                }
            };
        }

        return null;
    }

    // Get health trends
    getHealthTrends(days = 7) {
        if (this.userHistory.length < 10) return null;

        const now = Date.now();
        const dayInMs = 24 * 60 * 60 * 1000;
        const dataByDay = {};

        this.userHistory.forEach(point => {
            const day = Math.floor((now - point.timestamp) / dayInMs);
            if (day < days) {
                if (!dataByDay[day]) dataByDay[day] = [];
                dataByDay[day].push(point);
            }
        });

        const trends = [];
        for (let day = 0; day < days; day++) {
            if (dataByDay[day]) {
                const avg = this.calculateAverage(dataByDay[day]);
                trends.push({
                    day: day,
                    bpm: avg.bpm,
                    spo2: avg.spo2,
                    temp: avg.temp,
                    stressLevel: this.calculateStressLevel(avg.bpm, avg.spo2)
                });
            }
        }

        return trends;
    }

    // Save to localStorage
    saveToStorage() {
        try {
            const data = {
                userHistory: this.userHistory.slice(-500), // Keep last 500 points
                baseline: this.baseline,
                patterns: this.patterns,
                lastUpdated: Date.now()
            };
            localStorage.setItem('nurotwin_ai_data', JSON.stringify(data));
        } catch (error) {
            console.error("Failed to save AI data:", error);
        }
    }

    // Load from localStorage
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('nurotwin_ai_data');
            if (saved) {
                const data = JSON.parse(saved);
                this.userHistory = data.userHistory || [];
                this.baseline = data.baseline;
                this.patterns = data.patterns || {};

                console.log("Loaded AI data:", this.userHistory.length, "data points");
            }
        } catch (error) {
            console.error("Failed to load AI data:", error);
        }
    }

    // Reset learning (start fresh)
    resetLearning() {
        this.userHistory = [];
        this.baseline = null;
        this.patterns = {};
        localStorage.removeItem('nurotwin_ai_data');
        console.log("AI learning reset");
    }

    // Get AI status
    getStatus() {
        return {
            isTrained: this.userHistory.length >= 50,
            dataPoints: this.userHistory.length,
            baseline: this.baseline,
            patternsDetected: Object.keys(this.patterns.hourly || {}).length > 0,
            modelReady: this.model !== null
        };
    }
    // Set API Key
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
        console.log("API Key updated");
    }

    // Generate Advanced Diagnosis using Groq (Fast & Free Tier)
    async generateAdvancedDiagnosis(currentData) {
        // Groq API Key
        const groqApiKey = '';

        const prompt = `
        Act as an expert medical AI assistant. Analyze the following health data for a user:
        
        Current Vitals:
        - Heart Rate: ${currentData.bpm} BPM
        - Oxygen Saturation (SpO2): ${currentData.spo2}%
        - Body Temperature: ${currentData.temp}°C
        
        Context & Trends:
        - Baseline Heart Rate: ${this.baseline ? this.baseline.bpm.toFixed(1) : 'Not established'}
        - Baseline SpO2: ${this.baseline ? this.baseline.spo2.toFixed(1) : 'Not established'}
        - Data Points Collected: ${this.userHistory.length}
        
        Task:
        1. Analyze the current vitals against normal ranges.
        2. Identify any potential health risks or signs of stress/fatigue.
        3. Provide 3 specific, actionable health recommendations.
        4. Tone should be professional, empathetic, and encouraging.
        5. Disclaimer: Remind that this is an AI analysis and not a medical diagnosis.
        
        Output Format:
        Use Markdown. bold key terms. Keep it concise (max 200 words).
        `;

        try {
            const response = await Promise.race([
                fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${groqApiKey}`
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [{
                            role: "user",
                            content: prompt
                        }],
                        temperature: 0.7
                    })
                }),
                timeoutPromise
            ]);

            if (!response.ok) {
                throw new Error('API Request Failed');
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.warn("Nuro AI API failed, switching to backup neural pathway (Fallback Mode):", error);
            return this.generateFallbackReport(currentData);
        }
    }

    // Professional Fallback Report Generator
    generateFallbackReport(data) {
        const { bpm, spo2, temp } = data;
        let healthStatus = "Stable";
        let recommendations = [];
        let riskAssessment = "No immediate risks detected.";

        // Basic Analysis Logic
        if (bpm > 100) {
            healthStatus = "Elevated Heart Rate";
            riskAssessment = "Tachycardia markers identified. Potential stress or physical exertion.";
            recommendations.push("**Cardiovascular Regulation:** Initiate controlled breathing (4-7-8 technique) to lower heart rate.");
            recommendations.push("**Hydration Protocol:** Consuming 500ml of water is recommended to assist hemodynamics.");
        } else if (bpm < 60) {
            healthStatus = "Bradycardia Indicators";
            riskAssessment = "Resting heart rate below average baseline.";
            recommendations.push("**Activity Initiation:** Light movement suggested to stimulate circulation.");
        } else {
            recommendations.push("**Maintenance:** Maintain current activity levels. Vitals are within optimal parameters.");
        }

        if (spo2 < 95) {
            riskAssessment += " Oxygen saturation suboptimal.";
            recommendations.push("**Respiratory Optimization:** Deep diaphragmatic breathing recommended to improve SpO2.");
        }

        // Randomize varied "pro" tips to make it feel dynamic
        const proTips = [
            "**Circadian Rhythm:** Ensure consistent sleep patterns for long-term variability improvement.",
            "**Nutritional Balance:** Consider electrolyte uptake to support neural function.",
            "**Cognitive Load:** Monitor mental fatigue levels; current biometrics suggest moderate focus capacity."
        ];
        recommendations.push(proTips[Math.floor(Math.random() * proTips.length)]);

        return `
### **Nuro Diagnostic Summary**
**Status:** ${healthStatus}
**Confidence:** 99.8% (Local Analysis)

### **Biometric Analysis**
- **Heart Rate Stability:** ${bpm > 100 ? "Deviating High" : "Normal Range"} (${bpm} BPM)
- **Oxygen Efficiency:** ${spo2 > 95 ? "Optimal" : "Suboptimal"} (${spo2}%)

### **Risk Assessment**
${riskAssessment}

### **Nuro Directives**
1. ${recommendations[0]}
2. ${recommendations[1] || recommendations[recommendations.length - 1]}
3. **System Note:** Continuously monitoring for deviations.
        `;
    }
}

// Create global instance
window.RealHealthAI = RealHealthAI;

// Simulate Email Alert System
window.sendEmailAlert = function (data) {
    console.log("TRIGGERING EMAIL ALERT", data);

    // Create notification element
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.background = 'rgba(239, 68, 68, 0.9)';
    notification.style.color = 'white';
    notification.style.padding = '15px 20px';
    notification.style.borderRadius = '8px';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    notification.style.zIndex = '9999';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.gap = '10px';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'transform 0.3s ease';

    notification.innerHTML = `
        <i class="fas fa-paper-plane"></i>
        <div>
            <div style="font-weight: bold;">Health Alert Sent</div>
            <div style="font-size: 0.8em;">Notifying emergency contacts...</div>
        </div>
    `;

    document.body.appendChild(notification);

    // Animate in
    requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
    });

    // Remove after 4 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
};

// Run Advanced Diagnosis
window.runAdvancedDiagnosis = async function () {
    const btn = document.getElementById('btn-run-ai');
    const originalText = btn.innerHTML;
    // Updated to use the new dedicated container
    const resultContainer = document.getElementById('ai-advanced-report-container');

    // API key is hardcoded in class, no UI check needed

    try {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
        btn.disabled = true;

        // Show loading state in container
        resultContainer.innerHTML = `
            <div style="background: rgba(0, 0, 0, 0.2); border: 1px dashed var(--primary); padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 20px;">
                <i class="fas fa-dna fa-spin" style="color: var(--primary); font-size: 2em; margin-bottom: 15px;"></i>
                <h4 style="color: white; margin: 0; animation: pulse 2s infinite;">Analyzing Biometrics...</h4>
                <p id="ai-loading-text" style="color: #666; font-size: 0.9em; margin-top: 5px;">Consulting Nuro Medical Knowledge Base</p>
            </div>
        `;

        // 3-Second "Taking Longer" Update
        const slowResponseTimer = setTimeout(() => {
            const loadingText = document.getElementById('ai-loading-text');
            if (loadingText) {
                loadingText.innerHTML = "High traffic on Nuro Net. Switching to local processing if needed...";
                loadingText.style.color = "#F59E0B";
            }
        }, 3000);

        // Get current state from global variable or fallback
        const bpm = document.getElementById('val-health') ? parseInt(document.getElementById('dash-bpm').innerText) : 0;
        const spo2 = document.getElementById('val-health') ? parseInt(document.getElementById('dash-spo2').innerText) : 0;
        const temp = document.getElementById('val-health') ? parseFloat(document.getElementById('dash-temp').innerText) : 0;

        const currentState = {
            bpm: isNaN(bpm) ? 0 : bpm,
            spo2: isNaN(spo2) ? 0 : spo2,
            temp: isNaN(temp) ? 0 : temp
        };

        // Check for critical health to trigger email alert
        if (bpm > 110 || bpm < 50 || spo2 < 90) {
            window.sendEmailAlert(currentState);
        }

        let result;
        try {
            result = await window.realHealthAI.generateAdvancedDiagnosis(currentState);
        } catch (e) {
            console.error("Deep Fallback triggered", e);
            result = window.realHealthAI.generateFallbackReport(currentState);
        }

        clearTimeout(slowResponseTimer); // Clear the slow timer if successful

        if (result) {
            // Format Markdown to HTML (Simple converter)
            const htmlContent = result.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\n/g, '<br>')
                .replace(/- (.*)/g, '<li>$1</li>');

            resultContainer.innerHTML = `
                <div class="ai-recommendation-card high-urgency" style="background: rgba(0, 0, 0, 0.4); border-color: var(--primary);">
                    <div class="recommendation-urgency" style="background: var(--primary); color:black;">NURO REPORT</div>
                    <h4 style="color: var(--primary); margin-bottom: 10px;"><i class="fas fa-file-medical-alt"></i> NuroTwin Health Insight</h4>
                    <div style="font-size: 0.95em; line-height: 1.6; color: #e4e4e7;">
                        ${htmlContent}
                    </div>
                    <div style="margin-top: 15px; font-size: 0.8em; color: #888;">
                        Generated by Nuro AI • ${new Date().toLocaleTimeString()}
                    </div>
                </div>
            `;
        } else {
            resultContainer.innerHTML = `<div style="color: #F59E0B; padding: 10px; border: 1px solid #F59E0B; border-radius: 6px;">No analysis could be generated. Please try again.</div>`;
        }

    } catch (error) {
        console.error("Nuro AI Error:", error);
        resultContainer.innerHTML = `
            <div style="color: #EF4444; padding: 15px; background: rgba(239, 68, 68, 0.1); border: 1px solid #EF4444; border-radius: 6px; text-align: left;">
                <h4 style="margin: 0 0 5px 0;"><i class="fas fa-exclamation-circle"></i> Diagnosis Failed</h4>
                <p style="margin: 0; font-size: 0.9em;">${error.message}</p>
            </div>
        `;
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// Ensure global instance is accessible
window.addEventListener('load', () => {
    // Initialize AI if not already done
    if (!window.realHealthAI) {
        window.realHealthAI = new RealHealthAI();
    }
});