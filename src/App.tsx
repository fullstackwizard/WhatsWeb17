import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  BarChart3, 
  Smartphone,
  ChevronDown,
  ChevronUp,
  Star,
  Target,
  Settings,
  Rocket,
  BrainCircuit,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const handleCheckout = async (planName: string, amount: number) => {
  try {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planName, amount }),
    });
    const data = await response.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("Erro ao criar sessão de pagamento.");
    }
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Erro ao conectar com o servidor de pagamento.");
  }
};

const WhatsAppAutomation = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const pollMessages = async () => {
      if (isProcessing) return;
      
      try {
        const response = await fetch('/api/whatsapp/pending');
        const pendingMessages = await response.json();

        if (pendingMessages && pendingMessages.length > 0) {
          setIsProcessing(true);
          for (const msg of pendingMessages) {
            console.log("Processing message from:", msg.from);
            
            // 1. Use Gemini to generate a response
            const model = "gemini-3-flash-preview";
            const prompt = `Você é um assistente de vendas automático para a empresa atendemosWhats. 
            O cliente disse: "${msg.text}". 
            Responda de forma educada, vendedora e direta, tentando qualificar o lead. 
            Não use mais de 200 caracteres.`;
            
            const result = await ai.models.generateContent({
              model,
              contents: prompt,
            });
            
            const replyText = result.text || "Olá! Como posso te ajudar?";

            // 2. Send the response back via WhatsApp
            await fetch('/api/whatsapp/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ to: msg.from, text: replyText }),
            });

            // 3. Mark as processed
            await fetch('/api/whatsapp/mark-processed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: msg.id }),
            });
          }
          setIsProcessing(false);
        }
      } catch (error) {
        console.error("Automation error:", error);
        setIsProcessing(false);
      }
    };

    const interval = setInterval(pollMessages, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [isProcessing]);

  return null; // This is a background worker component
};

const Logo = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center font-black text-brand-dark text-lg shadow-sm">
      W
    </div>
    <span className="font-bold text-xl tracking-tight text-slate-900">atendemos<span className="text-primary-dark">Whats</span></span>
  </div>
);

const Navbar = ({ onLogin }: { onLogin: () => void }) => (
  <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between h-16 items-center">
        <Logo />
        <div className="hidden md:flex items-center gap-8">
          <a href="#beneficios" className="text-sm font-medium text-slate-600 hover:text-primary-dark transition-colors">Benefícios</a>
          <a href="#planos" className="text-sm font-medium text-slate-600 hover:text-primary-dark transition-colors">Planos</a>
          <a href="#processo" className="text-sm font-medium text-slate-600 hover:text-primary-dark transition-colors">Como Funciona</a>
          <button 
            onClick={onLogin}
            className="bg-primary hover:bg-primary-dark text-brand-dark px-5 py-2 rounded-full text-sm font-bold transition-all shadow-lg shadow-primary/20"
          >
            Acessar Painel
          </button>
        </div>
      </div>
    </div>
  </nav>
);

const Hero = ({ onStart }: { onStart: () => void }) => (
  <section className="pt-32 pb-20 overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-primary/10 text-brand-dark px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
            <Zap size={14} className="text-primary-dark" />
            Atendimento Automático 24h
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-6">
            Eu coloco um <span className="text-primary-dark">vendedor automático</span> no seu WhatsApp.
          </h1>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed max-w-xl">
            Responda clientes em segundos, qualifique leads e aumente suas vendas sem precisar estar online o tempo todo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              onClick={onStart}
              className="bg-primary hover:bg-primary-dark text-brand-dark px-8 py-4 rounded-xl text-lg font-bold transition-all shadow-xl shadow-primary/30 flex items-center justify-center gap-2 group"
            >
              Quero o atendemosWhats
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="bg-white border border-slate-200 hover:border-primary text-slate-700 px-8 py-4 rounded-xl text-lg font-bold transition-all flex items-center justify-center gap-2">
              Ver Demonstração
            </button>
          </div>
          <div className="mt-10 flex items-center gap-4 text-sm text-slate-500">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <img 
                  key={i}
                  src={`https://picsum.photos/seed/user${i}/100/100`} 
                  className="w-8 h-8 rounded-full border-2 border-white"
                  alt="User"
                  referrerPolicy="no-referrer"
                />
              ))}
            </div>
            <span>+500 empresas escalando vendas no WhatsApp</span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative"
        >
          <div className="relative z-10 bg-slate-100 rounded-3xl p-4 shadow-2xl border border-white/50">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-brand-dark p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-brand-dark font-black">W</div>
                <div>
                  <div className="text-white font-bold text-sm">atendemosWhats</div>
                  <div className="text-white/70 text-xs">Online agora</div>
                </div>
              </div>
              <div className="p-4 space-y-4 h-[400px] bg-[#f0f2f5] overflow-y-auto">
                <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[80%] text-sm border border-slate-100">
                  Olá! Vi que você tem interesse em nossos produtos. Como posso te ajudar hoje? 😊
                </div>
                <div className="bg-primary/20 p-3 rounded-lg rounded-tr-none shadow-sm max-w-[80%] ml-auto text-sm border border-primary/10">
                  Gostaria de saber o preço do plano profissional.
                </div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-[80%] text-sm border border-slate-100"
                >
                  O Plano Profissional é ideal para empresas que querem gerar leads! Ele inclui IA treinada, qualificação automática e integração com CRM. Posso te enviar os detalhes?
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2 }}
                  className="bg-primary/20 p-3 rounded-lg rounded-tr-none shadow-sm max-w-[80%] ml-auto text-sm border border-primary/10"
                >
                  Sim, por favor!
                </motion.div>
              </div>
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                <div className="flex-1 bg-white border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-400">Digite uma mensagem...</div>
                <div className="bg-primary p-2 rounded-full text-brand-dark"><ArrowRight size={16} /></div>
              </div>
            </div>
          </div>
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10"></div>
        </motion.div>
      </div>
    </div>
  </section>
);

const ArgumentCard = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="p-8 rounded-2xl bg-slate-50 border border-slate-100 hover:border-primary/30 transition-all hover:shadow-xl hover:shadow-slate-200/50 group">
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-primary group-hover:text-brand-dark transition-colors">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

const Arguments = () => (
  <section id="beneficios" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
          Por que seu negócio precisa do <span className="text-primary-dark">atendemosWhats</span>?
        </h2>
        <p className="text-lg text-slate-600">
          Não deixe o dinheiro escapar por falta de atendimento imediato.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <ArgumentCard 
          icon={Clock} 
          title="Vendas 24h" 
          description="Você perde vendas fora do horário comercial? Sua IA atende e vende enquanto você dorme."
        />
        <ArgumentCard 
          icon={Zap} 
          title="Resposta Instantânea" 
          description="Demora pra responder faz o cliente ir pro concorrente. Responda em segundos, sempre."
        />
        <ArgumentCard 
          icon={Users} 
          title="Fim das Repetições" 
          description="Pare de responder sempre as mesmas perguntas. Deixe a IA cuidar do FAQ inteligente."
        />
        <ArgumentCard 
          icon={TrendingUp} 
          title="Escala de Vendas" 
          description="Seu WhatsApp vira um vendedor automático focado em conversão e geração de leads."
        />
      </div>
    </div>
  </section>
);

const PlanCard = ({ 
  title, 
  price, 
  setup, 
  features, 
  recommended = false,
  colorClass = "bg-primary",
  onSelect
}: { 
  title: string, 
  price: string, 
  setup: string, 
  features: string[], 
  recommended?: boolean,
  colorClass?: string,
  onSelect: () => void
}) => (
  <div className={`relative p-8 rounded-3xl border ${recommended ? 'border-primary shadow-2xl scale-105 z-10 bg-white' : 'border-slate-200 bg-slate-50/50'}`}>
    {recommended && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-brand-dark px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
        Mais Popular
      </div>
    )}
    <h3 className="text-2xl font-bold text-slate-900 mb-2">{title}</h3>
    <div className="mb-6">
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-extrabold text-slate-900">R$ {price}</span>
        <span className="text-slate-500 font-medium">/mês</span>
      </div>
      <div className="text-sm text-slate-500 mt-1">Setup único: R$ {setup}</div>
    </div>
    <ul className="space-y-4 mb-8">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
          <CheckCircle2 className="text-primary-dark shrink-0 mt-0.5" size={18} />
          {feature}
        </li>
      ))}
    </ul>
    <button 
      onClick={onSelect}
      className={`w-full py-4 rounded-xl font-bold transition-all ${recommended ? 'bg-primary text-brand-dark hover:bg-primary-dark shadow-lg shadow-primary/20' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
    >
      Escolher Plano
    </button>
  </div>
);

const Pricing = () => (
  <section id="planos" className="py-24 bg-slate-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
          Pacotes Simples para <span className="text-primary-dark">Resultados Reais</span>
        </h2>
        <p className="text-lg text-slate-600">
          Escolha o nível de automação ideal para o momento da sua empresa.
        </p>
      </div>
      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <PlanCard 
          title="Plano Essencial"
          price="197"
          setup="500"
          onSelect={() => handleCheckout("Plano Essencial", 197)}
          features={[
            "Chatbot com respostas automáticas",
            "Menu inicial (atendimento básico)",
            "FAQ inteligente",
            "Integração com WhatsApp",
            "Encaminhamento para humano"
          ]}
        />
        <PlanCard 
          title="Plano Profissional"
          price="497"
          setup="1.500"
          recommended={true}
          onSelect={() => handleCheckout("Plano Profissional", 497)}
          features={[
            "Tudo do Essencial +",
            "IA treinada com conteúdo da empresa",
            "Qualificação de leads automática",
            "Fluxos de vendas (orçamento/agendamento)",
            "Integração com CRM ou planilha"
          ]}
        />
        <PlanCard 
          title="Plano Premium"
          price="997"
          setup="3.000"
          onSelect={() => handleCheckout("Plano Premium", 997)}
          features={[
            "Tudo do Profissional +",
            "Funil completo de vendas no WhatsApp",
            "Automações (follow-up, recuperação)",
            "Integrações avançadas",
            "Relatórios e otimizações mensais"
          ]}
        />
      </div>
      <div className="mt-16 text-center">
        <p className="text-slate-500 text-sm">
          💡 <strong>Dica:</strong> Não vendemos apenas tecnologia, vendemos um serviço contínuo de otimização e resultados.
        </p>
      </div>
    </div>
  </section>
);

const Step = ({ number, title, description, items }: { number: string, title: string, description: string, items: string[] }) => (
  <div className="relative pl-12 pb-12 last:pb-0">
    <div className="absolute left-0 top-0 w-8 h-8 bg-primary text-brand-dark rounded-full flex items-center justify-center font-bold text-sm z-10">
      {number}
    </div>
    <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-200 last:hidden"></div>
    <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 mb-4">{description}</p>
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium border border-slate-200">
          {item}
        </span>
      ))}
    </div>
  </div>
);

const Process = () => (
  <section id="processo" className="py-24 bg-white">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">
            Nosso Processo de <span className="text-primary-dark">Entrega Padronizado</span>
          </h2>
          <p className="text-lg text-slate-600 mb-10">
            Trabalhamos em etapas claras para garantir que sua IA fale a língua do seu negócio e converta visitantes em clientes.
          </p>
          <div className="space-y-2">
            <Step 
              number="1" 
              title="Diagnóstico" 
              description="Entendemos seu negócio e mapeamos as principais dúvidas dos clientes."
              items={["Mapear dúvidas", "Definir objetivos"]}
            />
            <Step 
              number="2" 
              title="Estruturação" 
              description="Criamos os fluxos de conversa e definimos o tom de voz da sua marca."
              items={["Fluxos de conversa", "Tom de voz"]}
            />
            <Step 
              number="3" 
              title="Implementação" 
              description="Configuramos o WhatsApp, subimos o chatbot e realizamos testes internos."
              items={["Configurar API", "Testes internos"]}
            />
            <Step 
              number="4" 
              title="Treinamento da IA" 
              description="Alimentamos a IA com seus produtos, serviços e argumentos de venda."
              items={["Argumentos de venda", "Objeções"]}
            />
            <Step 
              number="5" 
              title="Otimização Contínua" 
              description="Ajustamos respostas e melhoramos a conversão com base em dados reais."
              items={["Melhorar conversão", "Novos fluxos"]}
            />
          </div>
        </div>
        <div className="bg-brand-dark rounded-3xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-brand-dark">
                <BrainCircuit size={28} />
              </div>
              <div>
                <h4 className="font-bold text-xl">Diferencial Exclusivo</h4>
                <p className="text-slate-400 text-sm">O que nos separa dos outros</p>
              </div>
            </div>
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="bg-white/10 p-2 rounded-lg h-fit"><CheckCircle2 className="text-primary" size={20} /></div>
                <div>
                  <h5 className="font-bold mb-1">IA Humanizada</h5>
                  <p className="text-slate-400 text-sm">Não é um robô travado. Nossa IA responde de forma natural e fluida.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-white/10 p-2 rounded-lg h-fit"><CheckCircle2 className="text-primary" size={20} /></div>
                <div>
                  <h5 className="font-bold mb-1">Foco Total em Vendas</h5>
                  <p className="text-slate-400 text-sm">Não fazemos apenas suporte. Criamos funis de vendas dentro do WhatsApp.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-white/10 p-2 rounded-lg h-fit"><CheckCircle2 className="text-primary" size={20} /></div>
                <div>
                  <h5 className="font-bold mb-1">Estratégia de Funil</h5>
                  <p className="text-slate-400 text-sm">Mapeamos cada etapa da jornada do seu cliente para maximizar o lucro.</p>
                </div>
              </li>
            </ul>
            <div className="mt-12 p-6 bg-white/5 rounded-2xl border border-white/10">
              <p className="italic text-slate-300 text-sm">
                "O chatbot vira a porta de entrada do seu ecossistema. Depois dele, podemos escalar com tráfego pago, landing pages e CRM."
              </p>
            </div>
          </div>
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  </section>
);

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-slate-200 py-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center text-left font-bold text-slate-900 group"
      >
        <span className="group-hover:text-primary-dark transition-colors">{question}</span>
        {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="pt-4 text-slate-600 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const FAQ = () => (
  <section className="py-24 bg-slate-50">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 className="text-3xl font-extrabold text-slate-900 mb-12 text-center">Dúvidas Frequentes</h2>
      <div className="space-y-2">
        <FAQItem 
          question="A IA realmente parece humana?" 
          answer="Sim! Utilizamos modelos avançados de linguagem que permitem que a IA entenda o contexto, gírias e responda de forma natural, fugindo daquele padrão de 'digite 1 para vendas'."
        />
        <FAQItem 
          question="Preciso ter um número de WhatsApp Business?" 
          answer="Sim, recomendamos o uso da API oficial do WhatsApp para garantir estabilidade e evitar bloqueios, especialmente para grandes volumes de mensagens."
        />
        <FAQItem 
          question="Como a IA aprende sobre a minha empresa?" 
          answer="Na etapa de treinamento, alimentamos a IA com seus manuais, lista de produtos, preços, FAQ e até gravações de atendimentos reais para que ela aprenda seu tom de voz."
        />
        <FAQItem 
          question="Posso intervir na conversa se necessário?" 
          answer="Com certeza. Em todos os planos, existe a opção de encaminhamento para um humano. Você pode assumir o chat a qualquer momento."
        />
      </div>
    </div>
  </section>
);

const CTA = ({ onStart }: { onStart: () => void }) => (
  <section className="py-20 bg-primary relative overflow-hidden">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
      <h2 className="text-4xl md:text-5xl font-extrabold text-brand-dark mb-8">
        Pronto para transformar seu WhatsApp em uma máquina de vendas?
      </h2>
      <p className="text-brand-dark/80 text-xl mb-10 max-w-2xl mx-auto font-medium">
        Pare de perder leads por demora no atendimento. Comece hoje sua automação inteligente.
      </p>
      <button 
        onClick={onStart}
        className="bg-brand-dark text-white hover:bg-brand-navy px-10 py-5 rounded-2xl text-xl font-bold transition-all shadow-2xl flex items-center justify-center gap-2 mx-auto group"
      >
        Falar com um Especialista
        <ArrowRight className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
      <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
    </div>
  </section>
);

const Footer = () => (
  <footer className="bg-brand-dark py-12 border-t border-white/5">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row justify-between items-center gap-8">
        <Logo className="brightness-0 invert" />
        <div className="flex gap-8 text-slate-400 text-sm">
          <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
          <a href="#" className="hover:text-white transition-colors">Privacidade</a>
          <a href="#" className="hover:text-white transition-colors">Contato</a>
        </div>
        <div className="text-slate-500 text-sm">
          © 2026 atendemosWhats. Todos os direitos reservados.
        </div>
      </div>
    </div>
  </footer>
);

const Dashboard = ({ onBack }: { onBack: () => void }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'numbers' | 'flows' | 'team' | 'clients'>('overview');

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setShowSuccess(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const SidebarItem = ({ id, icon: Icon, label }: { id: any, icon: any, label: string }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === id ? 'bg-primary text-primary-dark shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
    >
      <Icon size={20} />
      <span className="font-semibold text-sm">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <WhatsAppAutomation />
      {/* Sidebar */}
      <aside className="w-64 bg-brand-dark border-r border-brand-navy flex flex-col p-6">
        <div className="flex items-center gap-2 mb-10">
          <div className="bg-primary p-1.5 rounded-lg">
            <MessageSquare className="text-brand-dark w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">atendemos<span className="text-primary">Whats</span></span>
        </div>
        
        <nav className="flex-1 space-y-2">
          <SidebarItem id="overview" icon={BarChart3} label="Visão Geral" />
          <SidebarItem id="numbers" icon={Smartphone} label="Números WhatsApp" />
          <SidebarItem id="flows" icon={BrainCircuit} label="Fluxos de IA" />
          <SidebarItem id="team" icon={Users} label="Atendentes" />
          <SidebarItem id="clients" icon={Target} label="Clientes" />
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-100">
          <button 
            onClick={onBack}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all font-semibold text-sm"
          >
            <Rocket size={20} />
            Sair do Painel
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-700"
          >
            <CheckCircle2 size={20} />
            <span className="font-bold">Pagamento realizado com sucesso! Seu plano foi ativado.</span>
            <button onClick={() => setShowSuccess(false)} className="ml-auto text-green-500 hover:text-green-700">
              <Rocket size={18} />
            </button>
          </motion.div>
        )}
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeTab === 'overview' && 'Bem-vindo de volta, Admin'}
              {activeTab === 'numbers' && 'Gerenciar Números'}
              {activeTab === 'flows' && 'Construtor de Fluxos'}
              {activeTab === 'team' && 'Equipe de Atendimento'}
              {activeTab === 'clients' && 'Gestão de Clientes'}
            </h1>
            <p className="text-slate-500 text-sm">
              {activeTab === 'overview' && 'Aqui está o que está acontecendo hoje.'}
              {activeTab === 'numbers' && 'Conecte e monitore suas instâncias de WhatsApp.'}
              {activeTab === 'flows' && 'Configure a inteligência e os caminhos de venda.'}
              {activeTab === 'team' && 'Gerencie acessos e permissões dos atendentes.'}
              {activeTab === 'clients' && 'Configure o atendimento para cada empresa.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-full border border-slate-200 text-slate-400">
              <Settings size={20} />
            </div>
            <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full pl-2 pr-4 py-1.5">
              <div className="w-8 h-8 bg-slate-200 rounded-full overflow-hidden">
                <img src="https://picsum.photos/seed/admin/100/100" alt="Avatar" referrerPolicy="no-referrer" />
              </div>
              <span className="text-sm font-bold text-slate-700">Flávio Ribeiro</span>
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'numbers' && <NumbersTab />}
            {activeTab === 'flows' && <FlowsTab />}
            {activeTab === 'team' && <TeamTab />}
            {activeTab === 'clients' && <ClientsTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const OverviewTab = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={24} /></div>
        <span className="text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">+12%</span>
      </div>
      <div className="text-3xl font-bold text-slate-900">1,284</div>
      <div className="text-slate-500 text-sm font-medium">Leads Gerados</div>
    </div>
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-primary/10 text-primary-dark rounded-xl"><MessageSquare size={24} /></div>
        <span className="text-green-500 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg">+5%</span>
      </div>
      <div className="text-3xl font-bold text-slate-900">8,432</div>
      <div className="text-slate-500 text-sm font-medium">Mensagens Enviadas</div>
    </div>
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Star size={24} /></div>
        <span className="text-slate-400 text-xs font-bold bg-slate-50 px-2 py-1 rounded-lg">0%</span>
      </div>
      <div className="text-3xl font-bold text-slate-900">98.2%</div>
      <div className="text-slate-500 text-sm font-medium">Taxa de Satisfação</div>
    </div>
    <div className="md:col-span-3 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="font-bold text-lg mb-6">Atividade Recente</h3>
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400"><Smartphone size={20} /></div>
              <div>
                <div className="font-bold text-slate-900">Novo Lead: João Silva</div>
                <div className="text-xs text-slate-500">Interessado no Plano Profissional • Há 5 min</div>
              </div>
            </div>
            <button className="text-primary-dark text-sm font-bold hover:underline">Ver Conversa</button>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const NumbersTab = () => {
  const [isConfiguring, setIsConfiguring] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Automação IA Ativa
        </div>
        <button 
          onClick={() => setIsConfiguring(!isConfiguring)}
          className="bg-primary hover:bg-primary-dark text-primary-dark px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2"
        >
          <Zap size={18} />
          {isConfiguring ? 'Fechar Configuração' : 'Configurar API WhatsApp'}
        </button>
      </div>

      {isConfiguring && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-white p-8 rounded-2xl border-2 border-primary/20 shadow-xl"
        >
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Settings className="text-primary-dark" />
            Configuração da API Cloud (Meta)
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">WhatsApp Token (Permanent)</label>
              <input 
                type="password" 
                placeholder="EAAG..." 
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Phone Number ID</label>
              <input 
                type="text" 
                placeholder="123456789..." 
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700 flex gap-3">
            <AlertCircle size={20} className="shrink-0" />
            <div>
              <p className="font-bold mb-1">Como testar agora:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Configure seu Webhook na Meta para: <code className="bg-white px-1 rounded">/api/webhook/whatsapp</code></li>
                <li>Use o Verify Token definido no seu <code className="bg-white px-1 rounded">.env</code></li>
                <li>Envie um "Oi" para o número configurado e veja a IA responder em segundos!</li>
              </ol>
            </div>
          </div>
          <button className="mt-6 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all">
            Salvar Configurações
          </button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 text-primary-dark rounded-2xl flex items-center justify-center font-bold">W1</div>
            <div>
              <div className="font-bold text-slate-900">Vendas Principal</div>
              <div className="text-xs text-slate-500">+55 11 99999-9999</div>
            </div>
          </div>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Conectado</span>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-3 rounded-xl">
            <div className="text-xs text-slate-500 mb-1">Mensagens Hoje</div>
            <div className="font-bold">245</div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl">
            <div className="text-xs text-slate-500 mb-1">Uptime</div>
            <div className="font-bold">99.9%</div>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg text-sm font-bold transition-all">Configurações</button>
          <button className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 py-2 rounded-lg text-sm font-bold transition-all">Desconectar</button>
        </div>
      </div>
      <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
          <Smartphone size={32} />
        </div>
        <h3 className="font-bold text-slate-900 mb-2">Adicionar Instância</h3>
        <p className="text-slate-500 text-sm max-w-xs mb-6">Conecte um novo número via QR Code para expandir sua operação.</p>
        <button className="text-primary-dark font-bold hover:underline">Ver tutorial de conexão</button>
      </div>
    </div>
  </div>
);
};

const FlowsTab = () => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <div className="flex gap-2">
        <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-700">Todos</button>
        <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-500">Ativos</button>
        <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-500">Rascunhos</button>
      </div>
      <button className="bg-primary hover:bg-primary-dark text-primary-dark px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
        <BrainCircuit size={18} />
        Criar Novo Fluxo
      </button>
    </div>
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nome do Fluxo</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Gatilhos</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[
            { name: 'Boas-vindas & Qualificação', client: 'Imobiliária Silva', triggers: 'Palavra-chave: Oi, Olá', status: 'Ativo' },
            { name: 'Agendamento de Consulta', client: 'Dr. Marcos (Dentista)', triggers: 'Menu: Agendar', status: 'Ativo' },
            { name: 'Suporte Técnico Nível 1', client: 'TechSolutions', triggers: 'Palavra-chave: Ajuda', status: 'Rascunho' },
          ].map((flow, i) => (
            <tr key={i} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-bold text-slate-900">{flow.name}</div>
                <div className="text-xs text-slate-500">Atualizado há 2 dias</div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-600 font-medium">{flow.client}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{flow.triggers}</td>
              <td className="px-6 py-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${flow.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {flow.status}
                </span>
              </td>
              <td className="px-6 py-4">
                <button className="text-primary-dark font-bold text-sm hover:underline">Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const TeamTab = () => (
  <div className="space-y-6">
    <div className="flex justify-end">
      <button className="bg-primary hover:bg-primary-dark text-primary-dark px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
        <Users size={18} />
        Convidar Atendente
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[
        { name: 'Flávio Ribeiro', role: 'Admin', email: 'flavio@vendedor.com', status: 'Online' },
        { name: 'Ana Souza', role: 'Atendente', email: 'ana@vendedor.com', status: 'Online' },
        { name: 'Carlos Lima', role: 'Atendente', email: 'carlos@vendedor.com', status: 'Offline' },
      ].map((member, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden">
              <img src={`https://picsum.photos/seed/${member.name}/100/100`} alt={member.name} referrerPolicy="no-referrer" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{member.name}</div>
              <div className="text-xs text-slate-500">{member.email}</div>
            </div>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cargo</span>
            <span className="text-sm font-bold text-slate-700">{member.role}</span>
          </div>
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</span>
            <span className={`flex items-center gap-1.5 text-xs font-bold ${member.status === 'Online' ? 'text-green-500' : 'text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${member.status === 'Online' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
              {member.status}
            </span>
          </div>
          <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-600 py-2 rounded-lg text-sm font-bold transition-all">Gerenciar Acessos</button>
        </div>
      ))}
    </div>
  </div>
);

const ClientsTab = () => (
  <div className="space-y-6">
    <div className="flex justify-end">
      <button className="bg-primary hover:bg-primary-dark text-primary-dark px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2">
        <Target size={18} />
        Novo Cliente
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[
        { name: 'Imobiliária Silva', plan: 'Profissional', numbers: 2, activeFlows: 4 },
        { name: 'Dr. Marcos (Dentista)', plan: 'Essencial', numbers: 1, activeFlows: 2 },
      ].map((client, i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary-dark font-bold text-xl">
                {client.name[0]}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{client.name}</h3>
                <span className="text-xs font-bold text-primary-dark bg-primary/10 px-2 py-0.5 rounded-md uppercase tracking-wider">Plano {client.plan}</span>
              </div>
            </div>
            <button className="text-slate-400 hover:text-slate-600"><Settings size={20} /></button>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 p-4 rounded-xl">
              <div className="text-xs text-slate-500 mb-1">Números</div>
              <div className="text-xl font-bold">{client.numbers}</div>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl">
              <div className="text-xs text-slate-500 mb-1">Fluxos Ativos</div>
              <div className="text-xl font-bold">{client.activeFlows}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-primary text-primary-dark py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all">Configurar Fluxos</button>
            <button className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">Relatórios</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard'>('landing');

  if (view === 'dashboard') {
    return <Dashboard onBack={() => setView('landing')} />;
  }

  return (
    <div className="min-h-screen selection:bg-primary/30">
      <Navbar onLogin={() => setView('dashboard')} />
      <Hero onStart={() => setView('dashboard')} />
      <Arguments />
      <Pricing />
      <Process />
      <FAQ />
      <CTA onStart={() => setView('dashboard')} />
      <Footer />
    </div>
  );
}
