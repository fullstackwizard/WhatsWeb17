import React, { useState, useEffect, useRef } from 'react';
import { 
  Smartphone, 
  Users, 
  BrainCircuit, 
  Settings, 
  Play, 
  Plus, 
  Target, 
  Zap, 
  MessageSquare, 
  BarChart3, 
  ShieldCheck, 
  LogOut, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Copy, 
  ExternalLink, 
  Search, 
  Filter, 
  MoreVertical, 
  Send, 
  Bot, 
  User, 
  ChevronRight, 
  Trash2, 
  Save, 
  X, 
  QrCode, 
  Globe, 
  Key, 
  Database, 
  Webhook, 
  Cpu, 
  LayoutDashboard, 
  History, 
  HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

const NumbersTab = ({ 
  clientsData, 
  selectedClientId, 
  setSelectedClientId, 
  configStatus, 
  fetchClients 
}: { 
  clientsData: any, 
  selectedClientId: string | null, 
  setSelectedClientId: (id: string | null) => void,
  configStatus: any,
  fetchClients: () => void
}) => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [connectionType, setConnectionType] = useState<'qr' | 'meta'>('qr');
  const [metaConfig, setMetaConfig] = useState({ token: '', phoneNumberId: '', verifyToken: '' });

  const selectedClient = clientsData.clients.find((c: any) => c.id === selectedClientId);

  const handleConnect = async () => {
    if (!selectedClientId) return;
    setConnectionStatus('connecting');
    try {
      await fetch(`/api/whatsapp/connect/${selectedClientId}`);
      fetchClients();
    } catch (error) {
      console.error('Error connecting:', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleDisconnect = async () => {
    if (!selectedClientId) return;
    try {
      await fetch(`/api/whatsapp/disconnect/${selectedClientId}`);
      fetchClients();
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  };

  const handleSaveMetaConfig = async () => {
    if (!selectedClientId) return;
    try {
      await fetch(`/api/whatsapp/config/${selectedClientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaConfig)
      });
      fetchClients();
    } catch (error) {
      console.error('Error saving meta config:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <div className="flex-1 bg-[#0F0F0F] p-8 rounded-[40px] border border-white/5 shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner shadow-primary/20">
              <Smartphone size={28} />
            </div>
            <div>
              <h3 className="font-black text-2xl text-white tracking-tight">Conectar WhatsApp</h3>
              <p className="text-slate-400 text-sm">Escolha um cliente e conecte o número para automação.</p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Selecione o Cliente</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clientsData.clients.map((client: any) => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClientId(client.id)}
                    className={`p-5 rounded-3xl border-2 text-left transition-all duration-300 group ${
                      selectedClientId === client.id 
                        ? 'border-primary bg-primary/5 ring-4 ring-primary/10' 
                        : 'border-white/5 bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className={`font-bold text-lg ${selectedClientId === client.id ? 'text-primary' : 'text-slate-200'}`}>{client.name}</div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${client.status === 'open' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-600'}`}></div>
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest">
                        {client.status === 'open' ? 'Conectado' : 'Desconectado'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedClientId && (
              <div className="pt-8 border-t border-white/5">
                <div className="flex gap-2 p-1.5 bg-white/5 rounded-2xl mb-8">
                  <button 
                    onClick={() => setConnectionType('qr')}
                    className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${connectionType === 'qr' ? 'bg-primary text-primary-dark shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    QR Code
                  </button>
                  <button 
                    onClick={() => setConnectionType('meta')}
                    className={`flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${connectionType === 'meta' ? 'bg-primary text-primary-dark shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Meta API
                  </button>
                </div>

                {connectionType === 'qr' ? (
                  <div className="flex flex-col items-center text-center">
                    {selectedClient?.status === 'open' ? (
                      <div className="py-12">
                        <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-green-500/20">
                          <CheckCircle2 size={48} />
                        </div>
                        <h4 className="text-2xl font-black text-white mb-2">WhatsApp Conectado!</h4>
                        <p className="text-slate-400 mb-10 max-w-xs mx-auto">O número está pronto para responder automaticamente com IA.</p>
                        <button 
                          onClick={handleDisconnect}
                          className="bg-red-500/10 text-red-500 px-10 py-4 rounded-2xl font-black hover:bg-red-500/20 transition-all border border-red-500/20"
                        >
                          Desconectar Número
                        </button>
                      </div>
                    ) : (
                      <div className="w-full">
                        {selectedClient?.qr ? (
                          <div className="space-y-8">
                            <div className="bg-white p-6 rounded-[40px] border-4 border-primary inline-block shadow-[0_0_50px_rgba(255,204,0,0.3)]">
                              <img src={selectedClient.qr} alt="WhatsApp QR Code" className="w-64 h-64" />
                            </div>
                            <div className="max-w-xs mx-auto">
                              <p className="text-sm text-slate-400 font-medium leading-relaxed">Abra o WhatsApp no seu celular, vá em <span className="text-white font-bold">Aparelhos Conectados</span> e escaneie o código.</p>
                            </div>
                            <button 
                              onClick={handleConnect}
                              className="text-slate-500 text-xs font-black uppercase tracking-widest hover:text-primary flex items-center gap-2 mx-auto transition-colors"
                            >
                              <RefreshCw size={14} /> Gerar novo código
                            </button>
                          </div>
                        ) : (
                          <div className="py-12">
                            <div className="w-24 h-24 bg-white/5 text-slate-600 rounded-full flex items-center justify-center mx-auto mb-8">
                              <QrCode size={48} />
                            </div>
                            <button 
                              onClick={handleConnect}
                              className="bg-primary text-primary-dark px-12 py-5 rounded-3xl font-black shadow-[0_10px_40px_rgba(255,204,0,0.3)] hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm"
                            >
                              Gerar QR Code de Conexão
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Access Token</label>
                      <input 
                        type="password"
                        value={metaConfig.token}
                        onChange={(e) => setMetaConfig({...metaConfig, token: e.target.value})}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-white focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all"
                        placeholder="EAAB..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Phone Number ID</label>
                        <input 
                          type="text"
                          value={metaConfig.phoneNumberId}
                          onChange={(e) => setMetaConfig({...metaConfig, phoneNumberId: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-white focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all"
                          placeholder="1092..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Verify Token</label>
                        <input 
                          type="text"
                          value={metaConfig.verifyToken}
                          onChange={(e) => setMetaConfig({...metaConfig, verifyToken: e.target.value})}
                          className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-white focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all"
                          placeholder="meu_token_secreto"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleSaveMetaConfig}
                      className="w-full bg-white text-black py-5 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all mt-6 shadow-xl"
                    >
                      Salvar Configuração Meta
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="w-full md:w-80 space-y-6">
          <div className="bg-[#0F0F0F] p-6 rounded-[32px] border border-white/5 shadow-xl">
            <h4 className="font-black text-white mb-6 flex items-center gap-2 uppercase tracking-widest text-xs">
              <History size={18} className="text-primary" />
              Status do Sistema
            </h4>
            <div className="space-y-5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">Sessões Ativas</span>
                <span className="font-black text-white">{clientsData.clients.filter((c: any) => c.status === 'open').length}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">Latência Média</span>
                <span className="font-black text-green-500">142ms</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-bold">Mensagens/Min</span>
                <span className="font-black text-white">12</span>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 p-6 rounded-[32px] border border-primary/10">
            <h4 className="font-black text-primary mb-3 uppercase tracking-widest text-xs">Dica de Conexão</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Para maior estabilidade, utilize a Meta API oficial. A conexão via QR Code pode expirar se o celular ficar offline por muito tempo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClientsTab = ({ 
  clientsData, 
  selectedClientId, 
  setSelectedClientId, 
  onAdd, 
  onEdit, 
  onDelete 
}: { 
  clientsData: any, 
  selectedClientId: string | null, 
  setSelectedClientId: (id: string | null) => void,
  onAdd: () => void,
  onEdit: (client: any) => void,
  onDelete: (id: string) => void
}) => (
  <div className="space-y-6">
    <div className="bg-[#0F0F0F] p-8 rounded-[40px] border border-white/5 shadow-2xl">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="font-black text-3xl text-white mb-2 tracking-tight">Seus Clientes</h3>
          <p className="text-slate-400">Gerencie as contas e regras de atendimento de cada empresa.</p>
        </div>
        <button 
          onClick={onAdd}
          className="bg-primary text-primary-dark px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-primary/20 uppercase tracking-widest text-xs"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clientsData.clients.length > 0 ? (
          clientsData.clients.map((client: any) => (
            <div
              key={client.id}
              className={`p-8 rounded-[40px] border-2 transition-all relative group ${selectedClientId === client.id ? 'border-primary bg-primary/5 ring-8 ring-primary/5' : 'border-white/5 hover:border-white/10 bg-white/5'}`}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                  <Users size={28} />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onEdit(client)}
                    className="p-2.5 text-slate-500 hover:text-primary hover:bg-primary/20 rounded-xl transition-all"
                  >
                    <Settings size={20} />
                  </button>
                  <button 
                    onClick={() => onDelete(client.id)}
                    className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="font-black text-2xl text-white mb-2">{client.name}</h4>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${client.status === 'open' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-600'}`}></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    {client.status === 'open' ? 'WhatsApp Ativo' : 'Desconectado'}
                  </span>
                </div>
              </div>
              
              <div className="bg-black/40 p-5 rounded-3xl mb-8 border border-white/5">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Regra de Atendimento</div>
                <p className="text-xs text-slate-400 line-clamp-3 italic leading-relaxed">
                  {client.prompt || 'Nenhuma regra configurada.'}
                </p>
              </div>
              
              <button 
                onClick={() => setSelectedClientId(client.id)}
                className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${selectedClientId === client.id ? 'bg-primary text-primary-dark shadow-lg shadow-primary/20' : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
              >
                {selectedClientId === client.id ? 'Selecionado' : 'Gerenciar Conexão'}
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full py-24 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-700">
              <Users size={48} />
            </div>
            <h3 className="text-2xl font-black text-white mb-3">Nenhum cliente ainda</h3>
            <p className="text-slate-500 mb-10 max-w-xs mx-auto">Comece adicionando seu primeiro cliente para automatizar o atendimento.</p>
            <button 
              onClick={onAdd}
              className="bg-primary text-primary-dark px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-all shadow-2xl shadow-primary/20"
            >
              Adicionar Primeiro Cliente
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
);

const FlowsTab = ({ 
  flows, 
  clients, 
  onAdd, 
  onEdit, 
  onDelete 
}: { 
  flows: any[], 
  clients: any[], 
  onAdd: () => void, 
  onEdit: (flow: any) => void, 
  onDelete: (id: string) => void 
}) => (
  <div className="space-y-8">
    <div className="flex justify-between items-center">
      <div className="flex gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
        <button className="bg-primary text-primary-dark px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all">Todos</button>
        <button className="text-slate-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-slate-300 transition-all">Ativos</button>
        <button className="text-slate-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-slate-300 transition-all">Rascunhos</button>
      </div>
      <button 
        onClick={onAdd}
        className="bg-white text-black px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-2xl hover:bg-slate-200 uppercase tracking-widest text-[10px]"
      >
        <BrainCircuit size={18} />
        Criar Novo Fluxo
      </button>
    </div>
    <div className="bg-[#0F0F0F] rounded-[40px] border border-white/5 shadow-2xl overflow-hidden">
      <table className="w-full text-left">
        <thead className="bg-white/5 border-b border-white/5">
          <tr>
            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Nome do Fluxo</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Cliente</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Gatilhos</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
            <th className="px-8 py-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {flows.map((flow) => (
            <tr key={flow.id} className="hover:bg-white/[0.02] transition-colors group">
              <td className="px-8 py-6">
                <div className="font-bold text-white text-lg">{flow.name}</div>
                <div className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-1">ID: {flow.id}</div>
              </td>
              <td className="px-8 py-6 text-sm text-slate-400 font-medium">
                {clients.find(c => c.id === flow.clientId)?.name || 'Cliente não encontrado'}
              </td>
              <td className="px-8 py-6 text-sm text-slate-500 font-mono">{flow.triggers}</td>
              <td className="px-8 py-6">
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${flow.status === 'Ativo' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-white/5 text-slate-500 border border-white/10'}`}>
                  {flow.status}
                </span>
              </td>
              <td className="px-8 py-6">
                <div className="flex gap-4">
                  <button onClick={() => onEdit(flow)} className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline">Editar</button>
                  <button onClick={() => onDelete(flow.id)} className="text-red-500 font-black text-[10px] uppercase tracking-widest hover:underline">Excluir</button>
                </div>
              </td>
            </tr>
          ))}
          {flows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-8 py-20 text-center text-slate-600 italic font-medium">Nenhum fluxo criado ainda.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const PlaygroundTab = () => {
  const [testMessage, setTestMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!testMessage.trim()) return;
    
    const userMsg = testMessage;
    setTestMessage('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: userMsg }] }]
      });
      setChatHistory(prev => [...prev, { role: 'ai', text: response.text || 'Sem resposta.' }]);
    } catch (error) {
      console.error('Error in playground:', error);
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Erro ao processar mensagem.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-240px)] flex flex-col bg-[#0F0F0F] rounded-[40px] border border-white/5 shadow-2xl overflow-hidden">
      <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-hide">
        {chatHistory.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
            <Bot size={64} className="text-primary" />
            <div>
              <h4 className="text-xl font-black text-white uppercase tracking-widest">IA Playground</h4>
              <p className="text-sm text-slate-500">Teste as regras de atendimento em tempo real.</p>
            </div>
          </div>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[70%] p-6 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-primary text-primary-dark font-black shadow-xl shadow-primary/10' : 'bg-white/5 text-slate-300 border border-white/5'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 flex gap-2 items-center">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>
      <div className="p-10 border-t border-white/5 bg-black/20">
        <div className="flex gap-4 max-w-4xl mx-auto">
          <input 
            type="text" 
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Digite uma mensagem para testar a IA..."
            className="flex-1 bg-white/5 border border-white/5 rounded-2xl px-8 py-5 text-white placeholder:text-slate-600 focus:ring-2 focus:ring-primary focus:bg-white/10 transition-all outline-none"
          />
          <button 
            onClick={handleSendMessage}
            className="bg-primary text-primary-dark p-5 rounded-2xl shadow-2xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Send size={28} />
          </button>
        </div>
      </div>
    </div>
  );
};

const TeamTab = ({ 
  team, 
  onAdd, 
  onEdit, 
  onDelete 
}: { 
  team: any[], 
  onAdd: () => void, 
  onEdit: (member: any) => void, 
  onDelete: (id: string) => void 
}) => (
  <div className="space-y-8">
    <div className="flex justify-end">
      <button 
        onClick={onAdd}
        className="bg-primary text-primary-dark px-8 py-4 rounded-2xl font-black transition-all flex items-center gap-3 shadow-2xl shadow-primary/20 hover:scale-105 uppercase tracking-widest text-[10px]"
      >
        <Users size={18} />
        Convidar Atendente
      </button>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {team.map((member) => (
        <div key={member.id} className="bg-[#0F0F0F] p-8 rounded-[40px] border border-white/5 shadow-2xl group hover:border-primary transition-all duration-500">
          <div className="flex items-center gap-5 mb-8">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-500 font-black text-xl group-hover:bg-primary group-hover:text-primary-dark transition-all duration-500 shadow-inner">
              {member.name[0]}
            </div>
            <div className="flex-1">
              <h4 className="font-black text-xl text-white tracking-tight">{member.name}</h4>
              <div className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">{member.role}</div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(member)} className="p-2 text-slate-600 hover:text-primary transition-colors"><Settings size={18} /></button>
              <button onClick={() => onDelete(member.id)} className="p-2 text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
            </div>
          </div>
          <div className="text-sm text-slate-400 mb-8 font-medium bg-black/40 p-4 rounded-2xl border border-white/5">{member.email}</div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${member.status === 'Online' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-700'}`}></div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${member.status === 'Online' ? 'text-green-500' : 'text-slate-500'}`}>{member.status}</span>
            </div>
          </div>
        </div>
      ))}
      {team.length === 0 && (
        <div className="col-span-full py-24 text-center text-slate-600 italic font-medium">Nenhum membro na equipe ainda.</div>
      )}
    </div>
  </div>
);

const SettingsTab = () => (
  <div className="max-w-3xl space-y-10">
    <section>
      <h3 className="font-black text-2xl text-white mb-8 tracking-tight uppercase tracking-[0.1em]">Configurações Gerais</h3>
      <div className="space-y-6">
        <div className="bg-[#0F0F0F] p-8 rounded-[32px] border border-white/5 shadow-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors"><Globe size={28} /></div>
            <div>
              <div className="font-black text-lg text-white">Domínio Customizado</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">app.suaagencia.com</div>
            </div>
          </div>
          <button className="bg-white/5 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-dark transition-all">Configurar</button>
        </div>
        <div className="bg-[#0F0F0F] p-8 rounded-[32px] border border-white/5 shadow-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors"><Webhook size={28} /></div>
            <div>
              <div className="font-black text-lg text-white">Webhooks Globais</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Enviar eventos para URLs externas</div>
            </div>
          </div>
          <button className="bg-white/5 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-dark transition-all">Gerenciar</button>
        </div>
        <div className="bg-[#0F0F0F] p-8 rounded-[32px] border border-white/5 shadow-2xl flex items-center justify-between group hover:border-primary/30 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors"><Database size={28} /></div>
            <div>
              <div className="font-black text-lg text-white">Backup de Dados</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Exportar histórico de conversas</div>
            </div>
          </div>
          <button className="bg-white/5 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary hover:text-primary-dark transition-all">Exportar</button>
        </div>
      </div>
    </section>
  </div>
);

const FlowModal = ({ flow, clients, onClose, onSave, setFlow }: any) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-[#0F0F0F] w-full max-w-md rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
    >
      <div className="p-10 border-b border-white/5 flex justify-between items-center">
        <h3 className="font-black text-2xl text-white tracking-tight">{flow.id ? 'Editar Fluxo' : 'Novo Fluxo'}</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-slate-500 hover:text-white"><X size={24} /></button>
      </div>
      <div className="p-10 space-y-8">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nome do Fluxo</label>
          <input 
            type="text"
            value={flow.name}
            onChange={(e) => setFlow({ ...flow, name: e.target.value })}
            className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-white focus:ring-2 focus:ring-primary outline-none transition-all"
            placeholder="Ex: Qualificação de Leads"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Cliente</label>
          <select 
            value={flow.clientId}
            onChange={(e) => setFlow({ ...flow, clientId: e.target.value })}
            className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-white focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
          >
            <option value="" className="bg-[#0F0F0F]">Selecione um cliente</option>
            {clients.map((c: any) => <option key={c.id} value={c.id} className="bg-[#0F0F0F]">{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Gatilhos (Separados por vírgula)</label>
          <input 
            type="text"
            value={flow.triggers}
            onChange={(e) => setFlow({ ...flow, triggers: e.target.value })}
            className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-white focus:ring-2 focus:ring-primary outline-none transition-all"
            placeholder="Ex: Oi, Olá, Quero saber mais"
          />
        </div>
        <button 
          onClick={onSave}
          className="w-full bg-primary text-primary-dark py-5 rounded-3xl font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
        >
          {flow.id ? 'Salvar Alterações' : 'Criar Fluxo'}
        </button>
      </div>
    </motion.div>
  </div>
);

const TeamModal = ({ member, onClose, onSave, setMember }: any) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-[#0F0F0F] w-full max-w-md rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden"
    >
      <div className="p-10 border-b border-white/5 flex justify-between items-center">
        <h3 className="font-black text-2xl text-white tracking-tight">{member.id ? 'Editar Membro' : 'Convidar Membro'}</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-slate-500 hover:text-white"><X size={24} /></button>
      </div>
      <div className="p-10 space-y-8">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nome Completo</label>
          <input 
            type="text"
            value={member.name}
            onChange={(e) => setMember({ ...member, name: e.target.value })}
            className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-white focus:ring-2 focus:ring-primary outline-none transition-all"
            placeholder="Ex: João Silva"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">E-mail</label>
          <input 
            type="email"
            value={member.email}
            onChange={(e) => setMember({ ...member, email: e.target.value })}
            className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-white focus:ring-2 focus:ring-primary outline-none transition-all"
            placeholder="joao@empresa.com"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Cargo/Role</label>
          <select 
            value={member.role}
            onChange={(e) => setMember({ ...member, role: e.target.value })}
            className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-white focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
          >
            <option value="Atendente" className="bg-[#0F0F0F]">Atendente</option>
            <option value="Supervisor" className="bg-[#0F0F0F]">Supervisor</option>
            <option value="Admin" className="bg-[#0F0F0F]">Admin</option>
          </select>
        </div>
        <button 
          onClick={onSave}
          className="w-full bg-primary text-primary-dark py-5 rounded-3xl font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
        >
          {member.id ? 'Salvar Alterações' : 'Convidar Agora'}
        </button>
      </div>
    </motion.div>
  </div>
);

const PromptModal = ({ client, onClose, onSave, setClient }: any) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-[#0F0F0F] w-full max-w-2xl rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
    >
      <div className="p-10 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0F0F0F] z-10">
        <div>
          <h3 className="font-black text-3xl text-white tracking-tight">Editar Cliente</h3>
          <p className="text-slate-500 text-sm mt-1">Configure as regras e integrações para {client?.name}.</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-slate-500 hover:text-white"><X size={24} /></button>
      </div>
      <div className="p-10 space-y-10">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Nome da Empresa</label>
          <input 
            type="text"
            value={client?.name || ''}
            onChange={(e) => setClient({ ...client, name: e.target.value })}
            className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-white text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Instrução do Sistema (Prompt)</label>
          <textarea 
            value={client?.prompt || ''}
            onChange={(e) => setClient({ ...client, prompt: e.target.value })}
            className="w-full h-64 bg-white/5 border border-white/5 rounded-3xl p-8 text-white text-sm focus:ring-2 focus:ring-primary resize-none leading-relaxed outline-none transition-all"
            placeholder="Ex: Você é um atendente prestativo da Imobiliária Silva..."
          />
        </div>
        
        <div className="pt-10 border-t border-white/5">
          <h4 className="font-black text-sm text-white mb-6 uppercase tracking-[0.2em]">Configuração Meta API (Opcional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">WhatsApp Token</label>
              <input 
                type="text"
                value={client?.whatsappToken || ''}
                onChange={(e) => setClient({ ...client, whatsappToken: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="EAAG..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Phone Number ID</label>
              <input 
                type="text"
                value={client?.whatsappPhoneNumberId || ''}
                onChange={(e) => setClient({ ...client, whatsappPhoneNumberId: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="1092..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Verify Token</label>
              <input 
                type="text"
                value={client?.whatsappVerifyToken || ''}
                onChange={(e) => setClient({ ...client, whatsappVerifyToken: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="meu_token_secreto"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-6">
          <button 
            onClick={onSave}
            className="flex-1 bg-primary text-primary-dark py-5 rounded-3xl font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
          >
            Salvar Alterações
          </button>
          <button 
            onClick={onClose}
            className="px-10 bg-white/5 text-slate-400 py-5 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-white/10 transition-all"
          >
            Cancelar
          </button>
        </div>
      </div>
    </motion.div>
  </div>
);

const AddClientModal = ({ newClient, setNewClient, onClose, onSave }: any) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      className="bg-[#0F0F0F] w-full max-w-md rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden max-h-[90vh] overflow-y-auto"
    >
      <div className="p-10 border-b border-white/5 flex justify-between items-center sticky top-0 bg-[#0F0F0F] z-10">
        <h3 className="font-black text-2xl text-white tracking-tight">Novo Cliente</h3>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-slate-500 hover:text-white"><X size={24} /></button>
      </div>
      <div className="p-10 space-y-8">
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nome da Empresa</label>
          <input 
            type="text"
            value={newClient.name}
            onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
            className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm text-white focus:ring-2 focus:ring-primary outline-none transition-all"
            placeholder="Ex: Clínica Sorriso"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Regra Inicial (Opcional)</label>
          <textarea 
            value={newClient.prompt}
            onChange={(e) => setNewClient({ ...newClient, prompt: e.target.value })}
            className="w-full h-40 bg-white/5 border border-white/5 rounded-3xl p-6 text-sm text-white focus:ring-2 focus:ring-primary outline-none transition-all resize-none leading-relaxed"
            placeholder="Como a IA deve responder?"
          />
        </div>
        <div className="pt-8 border-t border-white/5">
          <h4 className="font-black text-xs text-white mb-6 uppercase tracking-[0.2em]">Configuração Meta API (Opcional)</h4>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">WhatsApp Token</label>
              <input 
                type="text"
                value={newClient.whatsappToken || ''}
                onChange={(e) => setNewClient({ ...newClient, whatsappToken: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="EAAG..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Phone Number ID</label>
              <input 
                type="text"
                value={newClient.whatsappPhoneNumberId || ''}
                onChange={(e) => setNewClient({ ...newClient, whatsappPhoneNumberId: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="1092..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Verify Token</label>
              <input 
                type="text"
                value={newClient.whatsappVerifyToken || ''}
                onChange={(e) => setNewClient({ ...newClient, whatsappVerifyToken: e.target.value })}
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white focus:ring-2 focus:ring-primary outline-none transition-all"
                placeholder="meu_token_secreto"
              />
            </div>
          </div>
        </div>
        <button 
          onClick={onSave}
          className="w-full bg-primary text-primary-dark py-5 rounded-3xl font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
        >
          Criar Cliente
        </button>
      </div>
    </motion.div>
  </div>
);

export default function App() {
  return <Dashboard />;
}

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('numbers');
  const [clients, setClients] = useState<any[]>([]);
  const [flows, setFlows] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [newClient, setNewClient] = useState({ name: '', prompt: '', whatsappToken: '', whatsappPhoneNumberId: '', whatsappVerifyToken: '' });
  
  const [isAddingFlow, setIsAddingFlow] = useState(false);
  const [editingFlow, setEditingFlow] = useState<any>(null);
  const [newFlow, setNewFlow] = useState({ name: '', clientId: '', triggers: '' });

  const [isAddingTeam, setIsAddingTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [newTeam, setNewTeam] = useState({ name: '', email: '', role: 'Atendente' });

  const [geminiKeySet, setGeminiKeySet] = useState(true);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/debug/whatsapp');
      const data = await response.json();
      setClients(data.clients || []);
      setGeminiKeySet(data.geminiKeySet);
      if (data.clients && data.clients.length > 0 && !selectedClientId) {
        setSelectedClientId(data.clients[0].id);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchFlows = async () => {
    try {
      const res = await fetch('/api/flows');
      const data = await res.json();
      setFlows(data);
    } catch (e) {
      console.error("Error fetching flows", e);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      setTeam(data);
    } catch (e) {
      console.error("Error fetching team", e);
    }
  };

  useEffect(() => {
    fetchClients();
    fetchFlows();
    fetchTeam();
    const interval = setInterval(() => {
      fetchClients();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAddClient = async () => {
    if (!newClient.name) return;
    try {
      await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      setIsAddingClient(false);
      setNewClient({ name: '', prompt: '', whatsappToken: '', whatsappPhoneNumberId: '', whatsappVerifyToken: '' });
      fetchClients();
    } catch (error) {
      console.error('Error adding client:', error);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
    try {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient) return;
    try {
      await fetch(`/api/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClient)
      });
      setEditingClient(null);
      setIsEditingPrompt(false);
      fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleAddFlow = async () => {
    try {
      const res = await fetch('/api/flows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newFlow)
      });
      if (res.ok) {
        setIsAddingFlow(false);
        setNewFlow({ name: '', clientId: '', triggers: '' });
        fetchFlows();
      }
    } catch (e) {
      console.error("Error adding flow", e);
    }
  };

  const handleUpdateFlow = async () => {
    try {
      const res = await fetch(`/api/flows/${editingFlow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingFlow)
      });
      if (res.ok) {
        setEditingFlow(null);
        fetchFlows();
      }
    } catch (e) {
      console.error("Error updating flow", e);
    }
  };

  const handleDeleteFlow = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este fluxo?')) return;
    try {
      const res = await fetch(`/api/flows/${id}`, { method: 'DELETE' });
      if (res.ok) fetchFlows();
    } catch (e) {
      console.error("Error deleting flow", e);
    }
  };

  const handleAddTeam = async () => {
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam)
      });
      if (res.ok) {
        setIsAddingTeam(false);
        setNewTeam({ name: '', email: '', role: 'Atendente' });
        fetchTeam();
      }
    } catch (e) {
      console.error("Error adding team member", e);
    }
  };

  const handleUpdateTeam = async () => {
    try {
      const res = await fetch(`/api/team/${editingTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTeam)
      });
      if (res.ok) {
        setEditingTeam(null);
        fetchTeam();
      }
    } catch (e) {
      console.error("Error updating team member", e);
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este membro?')) return;
    try {
      const res = await fetch(`/api/team/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTeam();
    } catch (e) {
      console.error("Error deleting team member", e);
    }
  };

  const selectedClient = clients.find((c: any) => c.id === selectedClientId);

  return (
    <div className="min-h-screen bg-[#050505] flex text-slate-200">
      {/* Sidebar */}
      <div className="w-80 bg-[#0A0A0A] border-r border-white/5 flex flex-col shrink-0">
        <div className="p-10">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,204,0,0.3)]">
              <Zap className="text-primary-dark fill-primary-dark" size={28} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tighter text-white uppercase leading-none">Web17 AI</span>
              <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-1">Intelligence</span>
            </div>
          </div>
          
          <nav className="space-y-2">
            {[
              { id: 'numbers', icon: Smartphone, label: 'Conexões' },
              { id: 'clients', icon: Users, label: 'Empresas' },
              { id: 'flows', icon: BrainCircuit, label: 'Fluxos IA' },
              { id: 'playground', icon: Play, label: 'Playground' },
              { id: 'team', icon: ShieldCheck, label: 'Equipe' },
              { id: 'settings', icon: Settings, label: 'Ajustes' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all duration-300 ${
                  activeTab === item.id 
                    ? 'bg-primary text-primary-dark shadow-2xl shadow-primary/20 scale-[1.02]' 
                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-10 border-t border-white/5">
          <div className="bg-white/5 rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
            <div className="relative z-10">
              <div className="text-[10px] font-black text-slate-500 mb-2 uppercase tracking-widest">Plano Atual</div>
              <div className="text-xl font-black text-white mb-4">Agência Pro</div>
              <button className="w-full bg-white text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-slate-200">
                Upgrade
              </button>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-primary/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
          </div>
          
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 mt-6 transition-all">
            <LogOut size={18} />
            Sair do Painel
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-24 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-10 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
              {activeTab === 'numbers' ? 'WhatsApp' : activeTab}
            </h2>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cloud Core Online</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 bg-white/5 p-2 pr-6 rounded-2xl border border-white/5 hover:bg-white/10 transition-all cursor-pointer">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-dark text-sm font-black shadow-lg shadow-primary/20">FR</div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white uppercase tracking-widest">Flávio Ribeiro</span>
                <span className="text-[10px] font-bold text-slate-500">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <main className="flex-1 overflow-y-auto p-10 bg-[#050505]">
          {!geminiKeySet && (
            <div className="mb-10 bg-amber-500/5 border border-amber-500/20 p-8 rounded-[40px] flex items-start gap-6 shadow-2xl">
              <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shrink-0 shadow-inner shadow-amber-500/20">
                <AlertCircle size={28} />
              </div>
              <div>
                <h4 className="font-black text-amber-500 mb-2 uppercase tracking-widest text-sm">Gemini API Key Requerida</h4>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-2xl">
                  Para que a IA responda seus clientes, você precisa configurar sua chave de API do Google Gemini nas configurações do projeto.
                </p>
                <div className="flex gap-4">
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-amber-500 text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20"
                  >
                    Obter Chave API <ExternalLink size={14} />
                  </a>
                </div>
              </div>
            </div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'numbers' && (
                <NumbersTab 
                  clientsData={{ clients }} 
                  selectedClientId={selectedClientId} 
                  setSelectedClientId={setSelectedClientId}
                  configStatus={configStatus}
                  fetchClients={fetchClients}
                />
              )}
              {activeTab === 'clients' && (
                <ClientsTab 
                  clientsData={{ clients }} 
                  selectedClientId={selectedClientId} 
                  setSelectedClientId={setSelectedClientId}
                  onAdd={() => setIsAddingClient(true)}
                  onEdit={(client) => { setEditingClient(client); setIsEditingPrompt(true); }}
                  onDelete={handleDeleteClient}
                />
              )}
              {activeTab === 'flows' && (
                <FlowsTab 
                  flows={flows} 
                  clients={clients} 
                  onAdd={() => setIsAddingFlow(true)}
                  onEdit={(flow) => { setEditingFlow(flow); setIsAddingFlow(true); }}
                  onDelete={handleDeleteFlow}
                />
              )}
              {activeTab === 'playground' && (
                <PlaygroundTab />
              )}
              {activeTab === 'team' && (
                <TeamTab 
                  team={team} 
                  onAdd={() => setIsAddingTeam(true)}
                  onEdit={(member) => { setEditingTeam(member); setIsAddingTeam(true); }}
                  onDelete={handleDeleteTeam}
                />
              )}
              {activeTab === 'settings' && <SettingsTab />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isEditingPrompt && (
          <PromptModal 
            client={editingClient} 
            onClose={() => { setIsEditingPrompt(false); setEditingClient(null); }} 
            onSave={handleUpdateClient}
            setClient={setEditingClient}
          />
        )}
        {isAddingClient && (
          <AddClientModal 
            newClient={newClient}
            setNewClient={setNewClient}
            onClose={() => setIsAddingClient(false)}
            onSave={handleAddClient}
          />
        )}
        {isAddingFlow && (
          <FlowModal 
            flow={editingFlow || newFlow} 
            clients={clients}
            onClose={() => { setIsAddingFlow(false); setEditingFlow(null); }} 
            onSave={editingFlow ? handleUpdateFlow : handleAddFlow} 
            setFlow={editingFlow ? setEditingFlow : setNewFlow} 
          />
        )}
        {isAddingTeam && (
          <TeamModal 
            member={editingTeam || newTeam} 
            onClose={() => { setIsAddingTeam(false); setEditingTeam(null); }} 
            onSave={editingTeam ? handleUpdateTeam : handleAddTeam} 
            setMember={editingTeam ? setEditingTeam : setNewTeam} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
