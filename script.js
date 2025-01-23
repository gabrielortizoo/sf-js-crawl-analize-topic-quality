const OPENAI_API_KEY = ''; // Añade tu clave de OPEN AI
// Extraer el tópico desde la URL
const topic = window.location.href.split('/').filter(Boolean).pop().replace(/-/g, ' '); // Devuelve algo como: 'antivirus'

// Extraer información de cada programa
const programElements = Array.from(document.querySelectorAll('li.zpvWgq'));
const programs = programElements.map(program => {
    const title = program.querySelector('h2[data-meta="program-name"]')?.textContent.trim() || '';
    const subtitle = program.querySelector('h3[class="LpqBzG"]')?.textContent.trim() || '';
    const description = program.querySelector('p[data-meta="program-description"]')?.textContent.trim() || '';
    return { title, subtitle, description };
});

// Prompt para evaluar el score de relevancia
function buildEvaluationPrompt(programList) {
    const programDescriptions = programList.map((program, index) => `
        ${index + 1}) name: ${program.title}
            subtitle: ${program.subtitle || 'N/A'}
            description: ${program.description || 'N/A'}
    `).join('\n\n');

    return `
    Task:
    You are an experienced software reviewer with years of experience. Evaluate the relevance of a list of programs to the topic "Download ${topic}" based on the programs description and then, provide a relevancy score from 0 to 10, being 0, any of the programs in the list are relevant at all for the topic and 10, all the programs of the list are very relevant to the topic. 

    Only answer with the relevancy score. DON'T include any other information in the answer.

    List of programs:
    ${programDescriptions}

    Example output:
    "Relevancy score is: x/10"
    `;
}

// Función para llamar a OpenAI
function chatGptRequest(prompt) {
    return fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            "model": "gpt-4o-mini",
            "messages": [
                {
                    role: "user",
                    content: prompt
                }
            ],
            "temperature": 0.3 // Puedes ajustarlo entre 0 y 1, una puntuación más alta permite más creatividad
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text); });
        }
        return response.json();
    })
    .then(data => data.choices[0].message.content.trim());
}

// Flujo principal
async function analyzeTopic() {
    try {
        // Paso 1: Preparar lista de programas
        const evaluationPrompt = buildEvaluationPrompt(programs);
        // Paso 2: Evaluar el score de relevancia
        const score = await chatGptRequest(evaluationPrompt);
        // Devolver resultados a Screaming Frog
        return seoSpider.data(`${score}`);
    } catch (error) {
        return seoSpider.error(error);
    }
}

// Llamar al flujo principal
return analyzeTopic();
