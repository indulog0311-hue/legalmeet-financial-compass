import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
    ReferenceLine, Cell
} from 'recharts';
import {
    Shield,
    Target,
    Map,
    Zap,
    Briefcase,
    AlertTriangle,
    CheckCircle2,
    TrendingUp,
    Landmark
} from 'lucide-react';
import { formatCompact } from '@/lib/formatters';

// --- DATA: UNIT ECONOMICS WATERFALL ---
const waterfallData = [
    { name: 'Precio Lista', valor: 150000, tipo: 'total', fill: '#0A192F' }, // Navy Blue
    { name: 'Wompi', valor: -6500, tipo: 'resta', fill: '#EF4444' }, // Red
    { name: 'Efecty/Rural', valor: -7200, tipo: 'resta', fill: '#EF4444' },
    { name: 'GMF 4x1000', valor: -1200, tipo: 'resta', fill: '#EF4444' },
    { name: 'Pago Abogado', valor: -100000, tipo: 'resta', fill: '#EF4444' },
    { name: 'Margen Neto', valor: 35100, tipo: 'total', fill: '#10B981' } // Emerald
];

// Helper to prepare waterfall data for stacked bar chart simulation
const waterfallChartData = waterfallData.map((d, i) => {
    let start = 0;
    if (i > 0) {
        if (d.tipo === 'resta') {
            // Start is the accumulation of previous totals
            // Simplified for this specific visualization:
            // 150 -> 143.5 -> 136.3 -> 135.1 -> 35.1
            if (d.name === 'Wompi') start = 150000;
            if (d.name === 'Efecty/Rural') start = 143500;
            if (d.name === 'GMF 4x1000') start = 136300;
            if (d.name === 'Pago Abogado') start = 135100;
        }
    }
    return {
        name: d.name,
        valor: Math.abs(d.valor),
        start: d.tipo === 'total' ? 0 : start - Math.abs(d.valor),
        fill: d.fill,
        originalVal: d.valor
    };
});

// --- DATA: BENCHMARK RADAR ---
const radarData = [
    { subject: 'Penetración Rural', A: 5, B: 1, C: 3, fullMark: 5 },
    { subject: 'Automatización', A: 3, B: 5, C: 1, fullMark: 5 },
    { subject: 'Confianza Física', A: 5, B: 2, C: 4, fullMark: 5 },
    { subject: 'Costo Usuario', A: 4, B: 5, C: 1, fullMark: 5 },
    { subject: 'Seguridad (Escrow)', A: 5, B: 4, C: 2, fullMark: 5 },
];

// --- DATA: ROADMAP ---
const roadmap2026 = [
    { phase: 'Q1: Cimientos', tasks: ['Integración Wompi', 'Firma Truora (KYC)', 'MVP Despliegue'], status: 'current' },
    { phase: 'Q2: Piloto Rural', tasks: ['Activación Efecty', 'Onboarding 50 Abogados', '1ra Transacción Física'], status: 'pending' },
    { phase: 'Q3-Q4: Expansión', tasks: ['Campaña Facebook Ads', 'Breakeven Operativo', 'Saturación Bogotá'], status: 'pending' },
];

const visionFutura = [
    { year: 2029, title: 'Fintech Legal', desc: 'Wallet Legal Propia & Crédito Litigioso' },
    { year: 2036, title: 'Justicia Algorítmica', desc: 'Juez IA Certificado' },
];

// --- DATA: RISK HEATMAP ---
const risks = [
    { id: 1, title: 'Fee-Splitting', prob: 'Alta', imp: 'Crítico', protocol: 'Mandato Expreso', color: 'bg-red-500' },
    { id: 2, title: 'Fuga de Plataforma', prob: 'Media', imp: 'Alto', protocol: 'Incentivos Escrow', color: 'bg-orange-500' },
    { id: 3, title: 'Recalificación DIAN', prob: 'Media', imp: 'Medio', protocol: 'Planeación Fiscal', color: 'bg-yellow-500' },
];

export default function Strategy() {
    const [activeTab, setActiveTab] = useState('economics');

    return (
        <MainLayout>
            <div className="space-y-8 font-sans animate-fade-in pb-10">

                {/* HEADER "PHYGITAL" */}
                <div className="relative overflow-hidden rounded-2xl bg-[#0A192F] text-white p-8 border-b-4 border-[#C5A059] shadow-xl">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Badge className="bg-[#C5A059] text-[#0A192F] hover:bg-[#D4AF37]">INVESTMENT GRADE</Badge>
                                <span className="text-xs text-gray-400 font-mono">CONFIDENTIAL</span>
                            </div>
                            <h1 className="text-4xl font-bold font-montserrat tracking-tight mb-2">
                                LegalMeet <span className="text-[#C5A059]">Strategic Vision</span>
                            </h1>
                            <p className="text-gray-300 max-w-2xl text-lg">
                                Arquitectura Financiera Phygital: Conectando la Colombia Rural con Justicia de Alta Calidad.
                            </p>
                        </div>
                        <Landmark className="h-16 w-16 text-[#C5A059] opacity-20" />
                    </div>
                </div>

                {/* TABS NAVIGATION */}
                <Tabs defaultValue="economics" className="space-y-6" onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-white border shadow-sm h-12">
                        <TabsTrigger value="economics" className="data-[state=active]:bg-[#0A192F] data-[state=active]:text-[#C5A059]">Unit Economics</TabsTrigger>
                        <TabsTrigger value="risks" className="data-[state=active]:bg-[#0A192F] data-[state=active]:text-[#C5A059]">Mapa de Riesgos</TabsTrigger>
                        <TabsTrigger value="roadmap" className="data-[state=active]:bg-[#0A192F] data-[state=active]:text-[#C5A059]">Roadmap 2031</TabsTrigger>
                        <TabsTrigger value="benchmark" className="data-[state=active]:bg-[#0A192F] data-[state=active]:text-[#C5A059]">Benchmark</TabsTrigger>
                    </TabsList>

                    {/* 1. UNIT ECONOMICS TAB */}
                    <TabsContent value="economics" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 border-t-4 border-[#10B981] shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-[#0A192F]">
                                        <Target className="h-5 w-5" />
                                        Cascada de Valor: Consulta ING-001
                                    </CardTitle>
                                    <CardDescription>Desglose de márgenes y fricción financiera</CardDescription>
                                </CardHeader>
                                <CardContent className="h-96">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={waterfallChartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} />
                                            <YAxis tickFormatter={(val) => `$${formatCompact(val)}`} />
                                            <Tooltip
                                                formatter={(value, name, props) => {
                                                    const val = props.payload.originalVal;
                                                    return [`$${Math.abs(val).toLocaleString()}`, val > 0 ? 'Ingreso/Neto' : 'Costo/Egreso'];
                                                }}
                                                cursor={{ fill: 'transparent' }}
                                            />
                                            <Bar dataKey="start" stackId="a" fill="transparent" />
                                            <Bar dataKey="valor" stackId="a" radius={[4, 4, 4, 4]}>
                                                {waterfallChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                <Card className="bg-[#0A192F] text-white border-none shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="text-[#C5A059]">Take Rate Real</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-4xl font-bold mb-2">23.4%</div>
                                        <p className="text-sm text-gray-300">
                                            Del Ticket de $150k, capturamos $35.1k netos después de toda la fricción.
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card className="border-l-4 border-[#C5A059]">
                                    <CardHeader>
                                        <CardTitle className="text-sm uppercase tracking-wide text-gray-500">Escalabilidad</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Consulta (ING-001)</span>
                                                <Badge className="bg-[#10B981]">23% Margen</Badge>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Wizard (ING-004)</span>
                                                <Badge className="bg-[#0A192F] text-[#C5A059]">95% Margen</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                El Wizard automatizado elimina el costo de abogado, maximizando el EBITDA.
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    {/* 2. RISK HEATMAP TAB */}
                    <TabsContent value="risks">
                        <Card className="border-t-4 border-[#EF4444] shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#0A192F]">
                                    <Shield className="h-5 w-5" />
                                    Matriz de Riesgos Operativos
                                </CardTitle>
                                <CardDescription>Monitoreo activo de amenazas críticas</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg text-center mb-6 max-w-lg mx-auto border">
                                    <div className="p-2 text-xs font-bold text-gray-400">Impacto \ Prob.</div >
                                    <div className="p-2 text-sm font-semibold">Baja</div>
                                    <div className="p-2 text-sm font-semibold">Media</div>
                                    <div className="p-2 text-sm font-semibold">Alta</div>

                                    <div className="p-4 text-sm font-bold flex items-center justify-center">Crítico</div>
                                    <div className="aspect-square bg-green-100 rounded flex items-center justify-center relative border border-white"></div>
                                    <div className="aspect-square bg-yellow-100 rounded flex items-center justify-center relative border border-white"></div>
                                    <div className="aspect-square bg-red-100 rounded flex items-center justify-center relative border border-red-500 ring-2 ring-red-500 ring-offset-2">
                                        <div className="text-xs font-bold text-red-900">Fee Splitting</div>
                                    </div>

                                    <div className="p-4 text-sm font-bold flex items-center justify-center">Alto</div>
                                    <div className="aspect-square bg-green-100 rounded flex items-center justify-center relative border border-white"></div>
                                    <div className="aspect-square bg-orange-100 rounded flex items-center justify-center relative border border-orange-400 group cursor-help">
                                        <span className="text-xs font-bold text-orange-900">Fuga</span>
                                    </div>
                                    <div className="aspect-square bg-yellow-100 rounded flex items-center justify-center relative border border-white"></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {risks.map(risk => (
                                        <div key={risk.id} className="border rounded-lg p-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className={`absolute top-0 left-0 w-1 h-full ${risk.color}`}></div>
                                            <div className="ml-2">
                                                <h3 className="font-bold text-[#0A192F]">{risk.title}</h3>
                                                <div className="flex gap-2 mt-2 text-xs">
                                                    <Badge variant="outline">Prob: {risk.prob}</Badge>
                                                    <Badge variant="outline">Imp: {risk.imp}</Badge>
                                                </div>
                                                <div className="mt-3 text-sm bg-gray-50 p-2 rounded">
                                                    <span className="font-semibold text-xs text-gray-500 uppercase block mb-1">Protocolo de Mitigación</span>
                                                    {risk.protocol}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* 3. ROADMAP TAB */}
                    <TabsContent value="roadmap">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 border-t-4 border-[#0A192F] shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-[#0A192F]">
                                        <Map className="h-5 w-5" />
                                        Hoja de Ruta Táctica 2026
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-8">
                                    <div className="relative border-l-2 border-[#C5A059] ml-4 space-y-8 py-2">
                                        {roadmap2026.map((item, idx) => (
                                            <div key={idx} className="relative ml-6">
                                                <div className={`absolute -left-[31px] h-4 w-4 rounded-full border-2 border-white ${item.status === 'current' ? 'bg-[#10B981]' : 'bg-gray-300'
                                                    }`}></div>
                                                <h3 className="font-bold text-lg text-[#0A192F]">{item.phase}</h3>
                                                <ul className="mt-2 space-y-2">
                                                    {item.tasks.map((task, tIdx) => (
                                                        <li key={tIdx} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                                                            <CheckCircle2 className={`h-4 w-4 ${item.status === 'current' ? 'text-[#10B981]' : 'text-gray-300'}`} />
                                                            {task}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="space-y-6">
                                {/* Vision Cards */}
                                {visionFutura.map((item, idx) => (
                                    <Card key={idx} className="bg-gradient-to-br from-[#0A192F] to-[#172A45] text-white border-none shadow-xl">
                                        <CardHeader>
                                            <div className="flex justify-between items-center">
                                                <Badge className="bg-[#C5A059] text-[#0A192F]">{item.year}</Badge>
                                                <Zap className="h-5 w-5 text-[#C5A059]" />
                                            </div>
                                            <CardTitle className="mt-2">{item.title}</CardTitle>
                                            <CardDescription className="text-gray-400">{item.desc}</CardDescription>
                                        </CardHeader>
                                    </Card>
                                ))}

                                <div className="p-4 bg-[#F8FAFC] rounded-lg border border-gray-200">
                                    <h4 className="font-bold text-[#0A192F] mb-2 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Proyección de Crecimiento
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        La fase de expansión (Q3) es crítica. Se espera alcanzar el <span className="font-semibold text-[#10B981]">Breakeven Operativo</span> antes de finalizar el 2026 mediante la saturación del mercado piloto.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* 4. BENCHMARK TAB */}
                    <TabsContent value="benchmark">
                        <Card className="border-t-4 border-[#3B82F6] shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-[#0A192F]">
                                    <Briefcase className="h-5 w-5" />
                                    Estado del Arte Competitivo
                                </CardTitle>
                                <CardDescription>LegalMeet (Phygital) vs. Pure Tech vs. Tradicional</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[500px] flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis angle={30} domain={[0, 5]} />

                                        <Radar
                                            name="LegalMeet"
                                            dataKey="A"
                                            stroke="#0A192F"
                                            fill="#0A192F"
                                            fillOpacity={0.6}
                                        />
                                        <Radar
                                            name="Juzto.co"
                                            dataKey="B"
                                            stroke="#3B82F6"
                                            fill="#3B82F6"
                                            fillOpacity={0.3}
                                        />
                                        <Radar
                                            name="Tradicional"
                                            dataKey="C"
                                            stroke="#94A3B8"
                                            fill="#94A3B8"
                                            fillOpacity={0.2}
                                        />
                                        <Legend />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </TabsContent>

                </Tabs>
            </div>
        </MainLayout>
    );
}
