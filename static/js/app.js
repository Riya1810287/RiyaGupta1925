document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const startBtn = document.getElementById('startRecording');
    const stopBtn = document.getElementById('stopRecording');
    const meetingLinkInput = document.getElementById('meetingLink');
    const transcriptionEl = document.getElementById('transcription');
    const summaryEl = document.getElementById('summary');
    const recordingStatusEl = document.getElementById('recordingStatus');
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const downloadPdfBtn = document.getElementById('downloadPdf');
    
    // Initialize speech recognition if available
    let recognition;
    if ('webkitSpeechRecognition' in window) {
        recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onstart = function() {
            recordingStatusEl.textContent = 'Recording in progress...';
            startBtn.disabled = true;
            stopBtn.disabled = false;
        };
        
        recognition.onresult = function(event) {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            transcriptionEl.textContent = transcript;
        };
        
        recognition.onerror = function(event) {
            recordingStatusEl.textContent = 'Error: ' + event.error;
            startBtn.disabled = false;
            stopBtn.disabled = true;
        };
        
        recognition.onend = function() {
            recordingStatusEl.textContent = 'Recording stopped';
            startBtn.disabled = false;
            stopBtn.disabled = true;
            
            // Simulate processing the meeting
            if (transcriptionEl.textContent.trim().length > 0) {
                processMeeting();
            }
        };
    } else {
        recordingStatusEl.textContent = 'Speech recognition not supported in this browser';
        startBtn.disabled = true;
    }
    
    // Event Listeners
    startBtn.addEventListener('click', function() {
        const meetingLink = meetingLinkInput.value.trim();
        if (meetingLink) {
            console.log('Processing meeting:', meetingLink);
        }
        
        if (recognition) {
            recognition.start();
        } else {
            // Fallback for demo purposes
            recordingStatusEl.textContent = 'Recording simulation started';
            startBtn.disabled = true;
            stopBtn.disabled = false;
            
            // Simulate transcription
            setTimeout(() => {
                transcriptionEl.textContent = "Welcome to our project meeting. Today we'll discuss the timeline for the new feature rollout. The engineering team estimates 3 weeks for completion, while design needs 2 more weeks. Marketing suggests launching in Q2 for maximum impact.";
                recordingStatusEl.textContent = 'Recording stopped';
                startBtn.disabled = false;
                stopBtn.disabled = true;
                
                // Simulate processing
                processMeeting();
            }, 3000);
        }
    });
    
    stopBtn.addEventListener('click', function() {
        if (recognition) {
            recognition.stop();
        } else {
            recordingStatusEl.textContent = 'Recording stopped';
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    });
    
    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
    
    // Download PDF
    downloadPdfBtn.addEventListener('click', function() {
        alert('PDF download would be generated here in a real implementation');
    });
    
    // Load meeting history
    loadMeetingHistory();
    
    // Helper Functions
    function processMeeting() {
        recordingStatusEl.textContent = 'Processing meeting...';
        
        // Simulate API call to backend
        fetch('/process-meeting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                meeting_id: meetingLinkInput.value.trim() || 'Team Meeting'
            })
        })
        .then(response => response.json())
        .then(data => {
            summaryEl.innerHTML = `
                <h3>Meeting Summary</h3>
                <p><strong>Key Points:</strong></p>
                <ul>
                    <li>Project timeline discussion</li>
                    <li>Engineering estimates 3 weeks for feature completion</li>
                    <li>Design needs 2 additional weeks</li>
                    <li>Marketing recommends Q2 launch</li>
                </ul>
                <p><strong>Action Items:</strong></p>
                <ol>
                    <li>Engineering to provide detailed timeline by Friday</li>
                    <li>Design to finalize mockups</li>
                    <li>Schedule follow-up meeting for next week</li>
                </ol>
            `;
            
            recordingStatusEl.textContent = 'Meeting processed successfully';
            
            // Update meeting history
            loadMeetingHistory();
        })
        .catch(error => {
            console.error('Error:', error);
            recordingStatusEl.textContent = 'Processing failed';
        });
    }
    
    function loadMeetingHistory() {
        const historyEl = document.getElementById('meetingHistory');
        
        // Simulated history data
        const meetings = [
            {
                id: '1',
                title: 'Project Kickoff',
                date: new Date().toISOString().split('T')[0],
                summary: 'Initial project discussion and planning'
            },
            {
                id: '2',
                title: 'Design Review',
                date: new Date(Date.now() - 7*24*60*60*1000).toISOString().split('T')[0],
                summary: 'Reviewed UI mockups and provided feedback'
            }
        ];
        
        // Add current meeting if we have content
        if (transcriptionEl.textContent.trim().length > 0) {
            meetings.unshift({
                id: '3',
                title: meetingLinkInput.value.trim() || 'Team Meeting',
                date: new Date().toISOString().split('T')[0],
                summary: 'Discussed project timelines and deliverables'
            });
        }
        
        // Render history
        historyEl.innerHTML = meetings.map(meeting => `
            <div class="history-item" data-id="${meeting.id}">
                <h3>${meeting.title}</h3>
                <p><small>${meeting.date}</small></p>
                <p>${meeting.summary}</p>
            </div>
        `).join('');
        
        // Add click handlers to history items
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', function() {
                const meetingId = this.getAttribute('data-id');
                fetch(`/summary/${meetingId}`)
                    .then(response => response.json())
                    .then(data => {
                        transcriptionEl.textContent = data.transcript;
                        summaryEl.innerHTML = `<h3>Meeting Summary</h3><p>${data.summary}</p>`;
                    })
                    .catch(error => console.error('Error:', error));
            });
        });
    }
});