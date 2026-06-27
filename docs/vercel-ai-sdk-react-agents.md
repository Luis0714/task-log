# Vercel AI SDK + Patrón ReAct para Agentes

## 1. Teoría ReAct (Reasoning + Acting)

### ¿Qué es?

**ReAct** es un patrón de arquitectura para agentes LLM que combina razonamiento (*reasoning*) y acción (*acting*) en un ciclo iterativo. El modelo no responde directamente; en su lugar piensa, actúa, observa el resultado, y repite hasta llegar a la respuesta final.

### El ciclo ReAct

```
┌─────────────────────────────────────────────┐
│                                             │
│   Thought → Action → Observation → Thought  │
│       ↑                               │     │
│       └───────────────────────────────┘     │
│                    (loop)                   │
│                                             │
│   Final Answer cuando el modelo lo decide  │
└─────────────────────────────────────────────┘
```

| Fase | Descripción |
|---|---|
| **Thought** | El modelo razona internamente sobre qué hacer a continuación |
| **Action** | Ejecuta una herramienta (tool call) con parámetros concretos |
| **Observation** | Recibe el resultado de la herramienta |
| **Final Answer** | El modelo decide que tiene suficiente información y responde |

### Ejemplo conceptual

```
User: "¿Cuál es la temperatura actual en Madrid y cuánto es en Fahrenheit?"

Thought: Necesito buscar la temperatura en Madrid.
Action: getWeather({ city: "Madrid" })
Observation: "22°C"

Thought: Ahora necesito convertir 22°C a Fahrenheit.
Action: convertTemp({ celsius: 22 })
Observation: "71.6°F"

Thought: Ya tengo toda la información necesaria.
Final Answer: "En Madrid hay 22°C (71.6°F) ahora mismo."
```

### Por qué funciona

- El modelo no intenta resolver todo de golpe; divide el problema en pasos
- Cada observación actualiza el contexto del modelo
- El bucle termina cuando el modelo juzga que tiene la respuesta completa
- Los errores en herramientas se observan y el modelo puede corregir su estrategia

### ReAct en la práctica con LLMs

En términos de API, ReAct se implementa con **tool calling**:
1. El LLM emite un `tool_use` block en vez de texto final
2. El cliente ejecuta la herramienta
3. El resultado se manda de vuelta como `tool_result`
4. El LLM decide si necesita otra herramienta o ya puede responder

El número máximo de iteraciones se controla con `maxSteps` en el Vercel AI SDK.

---

## 2. Vercel AI SDK

### ¿Qué es?

Librería TypeScript unificada para trabajar con LLMs de múltiples proveedores bajo una única API. No está atada a Vercel o Next.js — funciona en cualquier entorno Node.js.

- **Repo/docs**: `ai-sdk.dev`
- **Package core**: `ai`
- **Versión actual**: v7+

### Arquitectura de paquetes

```
ai                    ← Core: generateText, streamText, generateObject, tool...
@ai-sdk/openai        ← Provider OpenAI
@ai-sdk/anthropic     ← Provider Anthropic (Claude)
@ai-sdk/google        ← Provider Google Gemini
@ai-sdk/azure         ← Provider Azure OpenAI
@ai-sdk/amazon-bedrock ← Provider AWS Bedrock
@ai-sdk/mistral       ← Provider Mistral AI
@ai-sdk/groq          ← Provider Groq
@ai-sdk/deepseek      ← Provider DeepSeek
@ai-sdk/cohere        ← Provider Cohere
@ai-sdk/xai           ← Provider xAI Grok
```

### Frameworks soportados

Next.js (App Router y Pages Router), SvelteKit, Nuxt, Node.js puro, Expo, Express, Hono, Fastify, Nest.js.

---

## 3. Instalación

```bash
# Core siempre necesario
pnpm add ai

# Más el provider que uses
pnpm add @ai-sdk/openai
pnpm add @ai-sdk/anthropic
pnpm add @ai-sdk/google
```

Variables de entorno mínimas:

```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

---

## 4. Providers — Configuración

### OpenAI

```typescript
import { openai } from '@ai-sdk/openai';
// Usa OPENAI_API_KEY automáticamente

// Config custom:
import { createOpenAI } from '@ai-sdk/openai';
const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1', // opcional
  organization: 'org-id',              // opcional
  project: 'project-id',               // opcional
});
```

**Modelos OpenAI disponibles:**

| API | Cómo llamarlo | Modelos |
|---|---|---|
| Responses API (default SDK v5+) | `openai('gpt-5')` o `openai.responses('gpt-5')` | gpt-5, gpt-5.5, gpt-4o, gpt-4o-mini |
| Chat API | `openai.chat('gpt-4o')` | gpt-4o, gpt-4-turbo, gpt-3.5-turbo |
| Completion API (legacy) | `openai.completion('gpt-3.5-turbo-instruct')` | gpt-3.5-turbo-instruct |
| Reasoning | `openai('o4-mini')` | o1, o3, o3-mini, o4-mini |
| Embeddings | `openai.embedding('text-embedding-3-small')` | text-embedding-3-small/large |
| Image gen | `openai.image('dall-e-3')` | dall-e-3, dall-e-2, gpt-image-1 |

**Herramientas built-in de OpenAI:**

```typescript
openai.tools.webSearch()          // Búsqueda web nativa
openai.tools.fileSearch()         // Búsqueda en archivos subidos
openai.tools.codeInterpreter()    // Ejecuta código Python
openai.tools.imageGeneration()    // Genera imágenes
openai.tools.shell()              // Ejecuta comandos de shell
openai.tools.mcp()                // Conecta a servidores MCP
openai.tools.customTool()         // Herramienta personalizada
```

---

### Anthropic (Claude)

```typescript
import { anthropic } from '@ai-sdk/anthropic';
// Usa ANTHROPIC_API_KEY automáticamente

// Config custom:
import { createAnthropic } from '@ai-sdk/anthropic';
const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: '...',     // opcional
  authToken: '...',   // alternativa a apiKey (Bearer)
});
```

**Modelos Claude disponibles:**

| Model ID | Descripción |
|---|---|
| `claude-opus-4-8` | Más capaz, ideal para tareas complejas |
| `claude-opus-4-7` | Opus generación anterior |
| `claude-sonnet-4-6` | Balance velocidad/inteligencia |
| `claude-haiku-4-5` | Más rápido y económico |

**Herramientas built-in de Anthropic:**

```typescript
anthropic.tools.webSearch_20250305()       // Búsqueda web en tiempo real
anthropic.tools.codeExecution_20260120()   // Ejecuta Python en sandbox
anthropic.tools.bash_20250124()            // Ejecuta bash
anthropic.tools.computer_20241022()        // Computer use
anthropic.tools.textEditor_20250124()      // Editor de archivos
anthropic.tools.memory_20250818()          // Memoria persistente
```

**Características especiales de Anthropic:**

```typescript
// Extended thinking / razonamiento
const model = anthropic('claude-opus-4-8', {
  thinking: { type: 'adaptive' }
});

// Cache control (ahorra tokens en prompts largos)
const result = await generateText({
  model: anthropic('claude-opus-4-8'),
  messages: [{
    role: 'user',
    content: [{
      type: 'text',
      text: 'Contexto muy largo...',
      experimental_providerMetadata: {
        anthropic: { cacheControl: { type: 'ephemeral' } } // TTL 5min o '1h'
      }
    }]
  }]
});
```

---

## 5. Funciones Core del SDK

### `generateText` — Respuesta completa

```typescript
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';

const { text, usage, finishReason } = await generateText({
  model: openai('gpt-4o'),
  prompt: 'Explica qué es TypeScript en una frase.',
  system: 'Responde siempre en español.',
  maxTokens: 500,
  temperature: 0.7,
});

console.log(text);
console.log(usage.totalTokens);
```

### `streamText` — Streaming token a token

```typescript
import { streamText } from 'ai';

const result = streamText({
  model: openai('gpt-4o'),
  prompt: 'Escribe un poema sobre el mar.',
});

// Iterar el stream
for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}

// O consumir todo al final
const text = await result.text;
const usage = await result.usage;
```

**En Next.js con streaming HTTP:**

```typescript
// app/api/chat/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
  });

  return result.toDataStreamResponse();
}
```

### `generateObject` — Salida estructurada con Zod

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

const { object } = await generateObject({
  model: openai('gpt-4o'),
  schema: z.object({
    titulo: z.string(),
    descripcion: z.string(),
    tags: z.array(z.string()),
    prioridad: z.enum(['alta', 'media', 'baja']),
  }),
  prompt: 'Crea una tarea para arreglar el bug de login.',
});

console.log(object.titulo);    // tipado, autocompletado
console.log(object.prioridad); // 'alta' | 'media' | 'baja'
```

### `streamObject` — Streaming de objeto estructurado

```typescript
import { streamObject } from 'ai';

const { partialObjectStream } = streamObject({
  model: openai('gpt-4o'),
  schema: z.object({ ... }),
  prompt: '...',
});

for await (const partial of partialObjectStream) {
  console.log(partial); // objeto parcial que se va completando
}
```

### `embed` y `embedMany` — Embeddings

```typescript
import { embed, embedMany } from 'ai';
import { openai } from '@ai-sdk/openai';

const { embedding } = await embed({
  model: openai.embedding('text-embedding-3-small'),
  value: 'Texto a vectorizar',
});

const { embeddings } = await embedMany({
  model: openai.embedding('text-embedding-3-small'),
  values: ['Texto 1', 'Texto 2', 'Texto 3'],
});
```

---

## 6. Tool Calling — Implementando ReAct

### Definir una herramienta

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const getWeather = tool({
  description: 'Obtiene el clima actual de una ciudad',
  parameters: z.object({
    city: z.string().describe('Nombre de la ciudad'),
    country: z.string().optional().describe('Código de país, ej: ES'),
  }),
  execute: async ({ city, country }) => {
    // Tu lógica aquí (llamada a API, DB, etc.)
    return { temperature: 22, condition: 'soleado', city };
  },
});
```

### Usar herramientas en generateText

```typescript
const { text, toolCalls, toolResults, steps } = await generateText({
  model: openai('gpt-4o'),
  tools: {
    getWeather,
    searchDatabase: tool({
      description: 'Busca registros en la base de datos',
      parameters: z.object({ query: z.string() }),
      execute: async ({ query }) => { /* ... */ return results; },
    }),
  },
  maxSteps: 5,  // máximo de iteraciones del loop ReAct
  prompt: '¿Qué clima hace en Madrid hoy?',
});
```

### Tool calling multi-step con streamText

```typescript
const result = streamText({
  model: openai('gpt-4o'),
  tools: { getWeather, convertCurrency },
  maxSteps: 10,
  messages: conversationHistory,
  onStepFinish: ({ text, toolCalls, toolResults, finishReason }) => {
    // Callback en cada paso del loop ReAct
    console.log('Paso completado:', finishReason);
  },
});

for await (const chunk of result.textStream) {
  process.stdout.write(chunk);
}
```

### Controlar cuándo usar herramientas

```typescript
// Forzar uso de herramienta específica
tool_choice: { type: 'tool', toolName: 'getWeather' }

// Forzar uso de alguna herramienta
tool_choice: 'required'

// Nunca usar herramientas
tool_choice: 'none'

// El modelo decide (default)
tool_choice: 'auto'
```

---

## 7. Conversaciones Multi-turn

```typescript
import { CoreMessage } from 'ai';

const messages: CoreMessage[] = [
  { role: 'user', content: 'Hola, me llamo Luis.' },
  { role: 'assistant', content: 'Hola Luis, ¿en qué puedo ayudarte?' },
  { role: 'user', content: '¿Cómo me llamo?' },
];

const { text } = await generateText({
  model: openai('gpt-4o'),
  messages,
  system: 'Eres un asistente útil.',
});
```

**Tipos de mensajes:**

```typescript
type CoreMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string | UserContent[] }
  | { role: 'assistant'; content: string | AssistantContent[] }
  | { role: 'tool'; content: ToolResultPart[] }
```

---

## 8. Agente Completo — Ejemplo Real

```typescript
import { generateText, tool } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// Definir herramientas del agente
const tools = {
  searchTasks: tool({
    description: 'Busca tareas en la base de datos por texto',
    parameters: z.object({
      query: z.string(),
      status: z.enum(['todo', 'in_progress', 'done']).optional(),
    }),
    execute: async ({ query, status }) => {
      // Aquí iría la query real a tu DB
      return [{ id: 1, title: 'Fix login bug', status: 'todo' }];
    },
  }),

  createTask: tool({
    description: 'Crea una nueva tarea',
    parameters: z.object({
      title: z.string(),
      description: z.string().optional(),
      assignee: z.string().optional(),
    }),
    execute: async (params) => {
      // Insertar en DB
      return { id: 42, ...params, created: true };
    },
  }),

  getProjectStats: tool({
    description: 'Obtiene estadísticas del proyecto',
    parameters: z.object({}),
    execute: async () => {
      return { total: 24, done: 12, inProgress: 7, todo: 5 };
    },
  }),
};

// Ejecutar el agente con loop ReAct
async function runAgent(userMessage: string) {
  const { text, steps } = await generateText({
    model: anthropic('claude-opus-4-8'),
    system: `Eres un asistente de gestión de proyectos.
Tienes acceso a herramientas para buscar, crear y analizar tareas.
Usa las herramientas necesarias para responder con información precisa.`,
    prompt: userMessage,
    tools,
    maxSteps: 8,
  });

  // Ver qué pasos hizo el agente
  for (const step of steps) {
    console.log('Step:', step.stepType);
    if (step.toolCalls?.length) {
      console.log('Tools called:', step.toolCalls.map(t => t.toolName));
    }
  }

  return text;
}

// Uso
const response = await runAgent('¿Cuántas tareas hay pendientes y cuáles son las más urgentes?');
```

---

## 9. Integración con Next.js App Router

### API Route con streaming

```typescript
// app/api/agent/route.ts
import { streamText, tool } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai('gpt-4o'),
    messages,
    system: 'Eres un asistente útil.',
    tools: {
      getInfo: tool({
        description: 'Obtiene información de la base de datos',
        parameters: z.object({ id: z.string() }),
        execute: async ({ id }) => fetchFromDB(id),
      }),
    },
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}
```

### Cliente con `useChat` hook

```tsx
// components/Chat.tsx
'use client';
import { useChat } from 'ai/react';

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/agent',
  });

  return (
    <div>
      {messages.map(m => (
        <div key={m.id}>
          <strong>{m.role}:</strong> {m.content}
        </div>
      ))}
      <form onSubmit={handleSubmit}>
        <input value={input} onChange={handleInputChange} disabled={isLoading} />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}
```

---

## 10. Metadatos y Observabilidad

```typescript
const { text, usage, finishReason, providerMetadata, steps } = await generateText({
  model: openai('gpt-4o'),
  prompt: '...',
  tools: { ... },
  maxSteps: 5,
});

// Uso de tokens
console.log(usage.promptTokens);
console.log(usage.completionTokens);
console.log(usage.totalTokens);

// Por qué terminó
console.log(finishReason); // 'stop' | 'length' | 'tool-calls' | 'error'

// Metadata específica del provider
console.log(providerMetadata?.openai?.responseId);
console.log(providerMetadata?.anthropic?.cacheReadInputTokens);

// Pasos del loop ReAct
steps.forEach((step, i) => {
  console.log(`Step ${i}:`, step.stepType, step.toolCalls?.length ?? 0, 'tool calls');
});
```

---

## 11. Tabla de Proveedores — Capacidades

| Provider | Text Gen | Streaming | Tool Calling | Image Input | Image Gen | Embeddings |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| OpenAI | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Anthropic | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Google Gemini | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Groq | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| DeepSeek | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Mistral | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Cohere | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 12. Resumen de Imports Más Usados

```typescript
// Core
import { generateText, streamText, generateObject, streamObject, embed, embedMany, tool } from 'ai';
import type { CoreMessage, LanguageModel, Tool, ToolResult } from 'ai';

// Providers
import { openai, createOpenAI } from '@ai-sdk/openai';
import { anthropic, createAnthropic } from '@ai-sdk/anthropic';
import { google, createGoogleGenerativeAI } from '@ai-sdk/google';

// React hooks (Next.js / React)
import { useChat, useCompletion, useObject } from 'ai/react';

// Zod (schemas para tools y structured output)
import { z } from 'zod';
```

---

## 13. Cuándo usar qué

| Caso de uso | Función |
|---|---|
| Respuesta simple sin streaming | `generateText` |
| Chat con streaming en tiempo real | `streamText` |
| Extraer datos estructurados | `generateObject` |
| Formulario con IA que se rellena progresivamente | `streamObject` |
| Agente que usa herramientas (ReAct loop) | `generateText` o `streamText` + `tools` + `maxSteps` |
| Búsqueda semántica / similitud | `embed` + `embedMany` |
| Chat en React/Next.js | `useChat` hook |
| Completar texto en React | `useCompletion` hook |
