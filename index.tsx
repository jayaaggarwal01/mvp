import React, { useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";

// --- Icon Components ---
const CodeIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-code-2">
    <path d="m18 16 4-4-4-4"/>
    <path d="m6 8-4 4 4 4"/>
    <path d="m14.5 4-5 16"/>
  </svg>
);

const EyeIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
);


// --- Gemini Service ---
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const createPrompt = (productIdea: string): string => `
You are an expert web developer specializing in creating beautiful and effective landing pages using HTML and Tailwind CSS.

Your task is to generate the complete HTML code for a single-file landing page based on the following product idea.

Product Idea: "${productIdea}"

**Requirements:**
1.  **Single HTML File:** The entire output must be a single, valid HTML file.
2.  **Tailwind CSS:** Use Tailwind CSS for all styling. You MUST include the Tailwind CSS CDN script \`<script src="https://cdn.tailwindcss.com"></script>\` in the \`<head>\` section. DO NOT use any other CSS or inline styles. Use a modern, visually appealing dark theme.
3.  **Structure:** The landing page should have the following sections, tailored to the product idea:
    *   A navigation bar with the product name and a primary CTA button.
    *   A hero section with a compelling headline, a descriptive sub-headline, and a clear call-to-action button.
    *   A "Features" section that highlights 3-4 key benefits of the product, using inline SVG icons and short descriptions.
    *   A "How It Works" or "Use Cases" section explaining the product in simple steps or scenarios.
    *   A simple "Pricing" section (even if it's just a placeholder with a "Contact Us" CTA).
    *   A final call-to-action section before the footer.
    *   A simple footer with social media links (placeholders) and copyright information.
4.  **Content:** Generate all necessary copy (headlines, descriptions, button text) based on the product idea. The tone should be professional yet engaging.
5.  **Placeholders:** Use placeholder images from \`https://picsum.photos/seed/{some_random_word}/800/600\`. Use different seeds for different images to ensure variety.
6.  **Icons:** Use inline SVG for icons (e.g., for features). The SVGs should be simple and modern.
7.  **Output Format:** Your response MUST be ONLY the HTML code itself, enclosed in a single markdown code block. Do not add any explanation or commentary before or after the code block.

Example Output format:
\`\`\`html
<!DOCTYPE html>
<html lang="en">
<head>
    ...
    <script src="https://cdn.tailwindcss.com"></script>
    ...
</head>
<body class="bg-gray-900 text-white">
    ...
</body>
</html>
\`\`\`
`;

const parseGeneratedCode = (rawResponse: string): string => {
    const codeBlockRegex = /```html\n([\s\S]*?)\n```/;
    const match = rawResponse.match(codeBlockRegex);
    if (match && match[1]) {
        return match[1].trim();
    }
    // Fallback if the wrapping isn't perfect
    if (rawResponse.trim().startsWith('<!DOCTYPE html>')) {
        return rawResponse.trim();
    }
    throw new Error("Failed to parse the generated code from the model's response.");
}

const generateLandingPage = async (productIdea: string): Promise<string> => {
    try {
        const prompt = createPrompt(productIdea);
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const rawCode = response.text;
        return parseGeneratedCode(rawCode);
    } catch (error) {
        console.error("Error generating landing page:", error);
        throw new Error("Could not connect to the generation service. Please try again later.");
    }
};

// --- UI Components ---

interface InputPanelProps {
  productIdea: string;
  setProductIdea: (idea: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

const InputPanel: React.FC<InputPanelProps> = ({
  productIdea,
  setProductIdea,
  onGenerate,
  isLoading,
}) => {
  return (
    <div className="flex flex-col h-full">
      <header>
        <h1 className="text-3xl font-bold text-white">MVP Creator</h1>
        <p className="mt-2 text-slate-400">
          Turn your idea into a landing page. Describe your product, and watch the magic happen.
        </p>
      </header>

      <div className="mt-8 flex-1 flex flex-col">
        <label htmlFor="product-idea" className="block text-sm font-medium text-slate-300 mb-2">
          Your Product Idea
        </label>
        <textarea
          id="product-idea"
          value={productIdea}
          onChange={(e) => setProductIdea(e.target.value)}
          placeholder="e.g., An AI-powered app that generates personalized workout plans based on user goals and available equipment."
          className="flex-1 w-full p-3 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition resize-none"
          disabled={isLoading}
        />
      </div>

      <div className="mt-6">
        <button
          onClick={onGenerate}
          disabled={isLoading || !productIdea.trim()}
          className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : '✨ Generate Landing Page'}
        </button>
      </div>
       <footer className="mt-8 text-center text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} MVP Creator. Powered by Gemini.</p>
      </footer>
    </div>
  );
};

interface PreviewPanelProps {
  htmlContent: string;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({ htmlContent }) => {
  return (
    <div className="w-full h-full bg-slate-800">
      <iframe
        srcDoc={htmlContent}
        title="Landing Page Preview"
        className="w-full h-full border-0"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

interface CodePanelProps {
  code: string;
}

const CodePanel: React.FC<CodePanelProps> = ({ code }) => {
    const [buttonText, setButtonText] = useState('Download Code');

    const handleDownload = () => {
        const blob = new Blob([code], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'landing-page.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setButtonText('Downloaded!');
        setTimeout(() => setButtonText('Download Code'), 2000);
    };

    return (
        <div className="relative w-full h-full bg-[#1e293b]">
            <div className="absolute top-4 right-4 z-10">
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
                >
                   <DownloadIcon /> {buttonText}
                </button>
            </div>
            <pre className="w-full h-full overflow-auto p-6 text-sm text-slate-200">
                <code className="language-html">
                    {code}
                </code>
            </pre>
        </div>
    );
};

// --- Main App Component ---

type ActiveTab = 'preview' | 'code';

const App: React.FC = () => {
  const [productIdea, setProductIdea] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('preview');

  const handleGenerate = useCallback(async () => {
    if (!productIdea.trim()) {
      setError('Please enter a product idea.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedCode('');

    try {
      const code = await generateLandingPage(productIdea);
      setGeneratedCode(code);
      setActiveTab('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [productIdea]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-indigo-500"></div>
          <p className="mt-4 text-lg">Generating your landing page...</p>
          <p className="mt-2 text-sm text-slate-500">This might take a moment.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-red-400 p-8">
            <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-lg text-center">
                <h3 className="text-xl font-semibold text-red-300 mb-2">Generation Failed</h3>
                <p>{error}</p>
            </div>
        </div>
      );
    }

    if (!generatedCode) {
      return (
        <div className="flex items-center justify-center h-full text-slate-500">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-300">Welcome to MVP Creator</h2>
            <p className="mt-2">Your generated landing page will appear here.</p>
          </div>
        </div>
      );
    }
    
    return activeTab === 'preview' ? (
      <PreviewPanel htmlContent={generatedCode} />
    ) : (
      <CodePanel code={generatedCode} />
    );
  };

  return (
    <div className="flex h-screen font-sans bg-slate-900 text-white">
      <div className="w-1/3 min-w-[400px] max-w-[550px] flex flex-col p-6 bg-slate-800/50 border-r border-slate-700">
        <InputPanel
          productIdea={productIdea}
          setProductIdea={setProductIdea}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />
      </div>
      <main className="flex-1 flex flex-col bg-slate-900">
        {generatedCode && !isLoading && !error && (
            <div className="flex-shrink-0 border-b border-slate-700">
                <div className="flex space-x-2 p-2">
                    <TabButton
                        isActive={activeTab === 'preview'}
                        onClick={() => setActiveTab('preview')}
                    >
                       <EyeIcon /> Preview
                    </TabButton>
                    <TabButton
                        isActive={activeTab === 'code'}
                        onClick={() => setActiveTab('code')}
                    >
                       <CodeIcon /> Code
                    </TabButton>
                </div>
            </div>
        )}
        <div className="flex-1 overflow-auto">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

interface TabButtonProps {
    isActive: boolean;
    onClick: () => void;
    children: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({ isActive, onClick, children }) => {
    const baseClasses = "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500";
    const activeClasses = "bg-indigo-600 text-white";
    const inactiveClasses = "text-slate-300 hover:bg-slate-700/50";
    
    return (
        <button className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`} onClick={onClick}>
            {children}
        </button>
    )
}

// --- App Mount ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
