import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Printer, Eye, Edit3, Loader2, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoFP from '@/assets/logo-fp-transcargas.png';
import logoANTT from '@/assets/logo-antt.png';

interface FaixaPreco {
  id: string;
  de: number;
  ate: number;
  valor_fixo: string;
  frete_peso: string;
  frete_valor: string;
  taxa: string;
  outros: string;
}

interface PercursoItem {
  percurso: string;
  frete_peso: string;
  frete_valor: string;
  taxa: string;
  outros: string;
}

export interface ContratoEditorProps {
  clienteNome: string;
  cnpj: string;
  telefone: string;
  formaPagamento: string;
  contatoNome?: string;
  tabelaSequencia: string | null;
  tabelaNome: string | null;
  faixas: FaixaPreco[];
  percursos?: PercursoItem[];
  onSave: (dados: ContratoSaveData) => void;
  onBack: () => void;
  saving?: boolean;
}

export interface ContratoSaveData {
  percursos: PercursoItem[];
  obs: string;
  fornecedor: string;
  validade_dias: string;
  pagamento_condicao: string;
}

const DEFAULT_PERCURSOS: PercursoItem[] = [
  { percurso: 'SP x Feira de Santana', frete_peso: 'R$ 0,98', frete_valor: '0,8%', taxa: '50,00', outros: '7%' },
];

const fmtCpfCnpj = (v: string) => {
  const d = v.replace(/\D/g, '');
  if (d.length <= 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').replace(/-$/, '');
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5').replace(/-$/, '');
};

const fmtPhone = (v: string) => {
  const d = v.replace(/\D/g, '');
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').replace(/-$/, '');
};

const ContratoEditor = ({
  clienteNome, cnpj, telefone, formaPagamento, contatoNome,
  tabelaSequencia, tabelaNome, faixas,
  percursos: initPercursos,
  onSave, onBack, saving = false,
}: ContratoEditorProps) => {
  const [preview, setPreview] = useState(false);
  const [percursos, setPercursos] = useState<PercursoItem[]>(initPercursos?.length ? initPercursos : DEFAULT_PERCURSOS);
  const [obs, setObs] = useState('MERCADORIAS COM VALOR ACIMA DE R$ 1.000,00 O FRETE SERÁ COBRADO 0,8% SOBRE NOTA FISCAL.');
  const [fornecedor, setFornecedor] = useState('');
  const [valDias, setValDias] = useState('45');
  const [pagCond, setPagCond] = useState('30 dias da data de emissão do conhecimento');
  const printRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const dia = format(now, 'dd', { locale: ptBR });
  const mes = format(now, 'MMMM', { locale: ptBR });
  const ano = format(now, 'yyyy');
  const dataFormatada = `${dia}  ${mes.charAt(0).toUpperCase() + mes.slice(1)} de ${ano}`;
  const cnpjF = fmtCpfCnpj(cnpj);
  const telF = fmtPhone(telefone);

  const handleSave = () => onSave({ percursos, obs, fornecedor, validade_dias: valDias, pagamento_condicao: pagCond });

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w || !printRef.current) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Contrato - ${clienteNome}</title>
      <style>
        @page{size:A4;margin:10mm 12mm}
        body{font-family:Arial,Helvetica,sans-serif;font-size:8pt;line-height:1.4;color:#000;margin:0;padding:10mm 12mm}
        table{border-collapse:collapse;width:100%}
        th,td{border:1px solid #000;padding:3px 6px;text-align:left}
        .bordered{border:1px solid #000;padding:6px 8px;margin-bottom:8px}
        .sig-line{border-top:1px solid #000;padding-top:4px;display:inline-block;min-width:200px;text-align:center}
        .footer-section{border-top:1px solid #000;margin-top:20px;padding-top:6px;text-align:center;font-size:8pt}
        .no-print{display:none!important}
      </style>
      </head><body>${printRef.current.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  const addP = () => setPercursos(p => [...p, { percurso: '', frete_peso: '', frete_valor: '', taxa: '', outros: '' }]);
  const updP = (i: number, f: keyof PercursoItem, v: string) => setPercursos(p => p.map((x, j) => j === i ? { ...x, [f]: v } : x));
  const rmP = (i: number) => { if (percursos.length > 1) setPercursos(p => p.filter((_, j) => j !== i)); };

  const inputS = (w?: string): React.CSSProperties => ({
    border: '1px dashed #999', borderRadius: '2px', padding: '2px 5px', fontSize: '8pt',
    fontFamily: 'Arial, sans-serif', width: w || '100%', background: '#fffff0',
  });

  const lastFaixa = faixas.length > 0 ? faixas[faixas.length - 1] : null;
  const tabelaTitulo = lastFaixa
    ? `TABELA DE PREÇOS DE 01 A ${lastFaixa.ate} Kg`
    : (tabelaNome || `TABELA DE PREÇOS ${tabelaSequencia || ''}`);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-card shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h2 className="text-sm font-semibold text-foreground leading-tight">Contrato — {clienteNome}</h2>
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              {tabelaSequencia && <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">Tab. {tabelaSequencia}</Badge>}
              {cnpjF} • {formaPagamento}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant={preview ? 'default' : 'outline'} size="sm" onClick={() => setPreview(!preview)}>
            {preview ? <Edit3 className="h-3.5 w-3.5 mr-1" /> : <Eye className="h-3.5 w-3.5 mr-1" />}
            {preview ? 'Editar' : 'Visualizar'}
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrint}><Printer className="h-3.5 w-3.5 mr-1" />Imprimir</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Document */}
      <div className="flex-1 overflow-auto bg-muted/40 py-8 flex justify-center">
        <div
          ref={printRef}
          className="bg-white shadow-2xl w-full max-w-[210mm] min-h-[297mm]"
          style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: '8pt', lineHeight: '1.4', color: '#000', padding: '20px 24px' }}
        >
          {/* ===== HEADER: Logo FP + ANTT ===== */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <img src={logoFP} alt="FP Transcargas" style={{ height: '50px', objectFit: 'contain' }} />
              <div>
                <div style={{ fontSize: '7pt', color: '#555' }}>Transporte de Cargas Rodoviárias</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', textAlign: 'right' }}>
              <div style={{ fontSize: '7pt', color: '#888' }}>
                <div style={{ fontWeight: 'bold' }}>ANTT</div>
                <div>Agência Nacional de<br/>Transportes Terrestres</div>
              </div>
              <img src={logoANTT} alt="ANTT" style={{ height: '40px', objectFit: 'contain' }} />
            </div>
          </div>

          {/* ===== DATA ===== */}
          <div style={{ border: '1px solid #000', padding: '4px 8px', marginBottom: '6px', fontSize: '8pt' }}>
            <strong>Feira de Santana,&nbsp;&nbsp;{dataFormatada}</strong>
            <span style={{ float: 'right' }}><strong>*****</strong></span>
          </div>

          {/* ===== BLOCO CLIENTE ===== */}
          <div style={{ border: '1px solid #000', padding: '6px 8px', marginBottom: '6px', fontSize: '8pt' }}>
            <p style={{ margin: '0 0 3px' }}>
              Razão do cliente – &nbsp;&nbsp;{clienteNome}&nbsp;&nbsp; {cnpjF}
            </p>
            <p style={{ margin: 0 }}>
              At.: Sr. {contatoNome || '___________'}
              <span style={{ display: 'inline-block', width: '100px' }}></span>
              CONTATO – {telF}
              <span style={{ display: 'inline-block', width: '80px' }}></span>
              <strong><em>FORMA DE PAGAMENTO- {formaPagamento}</em></strong>
            </p>
          </div>

          {/* ===== CORPO DO CONTRATO ===== */}
          <div style={{ border: '1px solid #000', padding: '6px 8px', marginBottom: '8px', fontSize: '8pt' }}>
            <p style={{ margin: '0 0 6px' }}><strong>Prezados Senhores</strong>:</p>
            <p style={{ margin: '0 0 6px', textAlign: 'justify' }}>
              Apresentação de tarifas de fretes para transportes de Mercadorias.
            </p>
            <p style={{ margin: '0 0 6px', textDecoration: 'underline' }}>CONDIÇÕES GERAIS:</p>
            <p style={{ margin: '0 0 6px', textAlign: 'justify' }}>
              1-Salvo nos casos de tarifas específicas, estabelece-se que as mercadorias de baixa densidade terão seu peso corrigido pelo volume <strong><u>(CUBAGEM).</u></strong> Na proporção de <strong><u>240 kg por cada m³,</u></strong> para cálculo do frete.
            </p>
            <p style={{ margin: 0, textAlign: 'justify' }}>
              2-Esta tarifa modificar-se-á sob aviso prévio, independente da vigência estipulada, por motivos de força maior e alheios à vontade do transportador.
            </p>
          </div>

          {/* ===== TABELA DE PREÇOS ===== */}
          {faixas.length > 0 && (
            <>
              <p style={{ margin: '0 0 4px', fontSize: '8pt' }}>
                <strong><u>{tabelaTitulo}</u></strong>.
              </p>
              <table style={{ width: 'auto', borderCollapse: 'collapse', marginBottom: '8px', border: '1px solid #000' }}>
                <tbody>
                  {faixas.map((f) => (
                    <tr key={f.id}>
                      <td style={{ border: '1px solid #000', padding: '3px 8px', fontSize: '10pt', fontWeight: 'bold', color: '#002060', whiteSpace: 'nowrap' }}>
                        DE&nbsp;&nbsp; {f.de} A {f.ate}&nbsp; Kg
                      </td>
                      <td style={{ border: '1px solid #000', padding: '3px 8px', fontSize: '10pt', fontWeight: 'bold', color: '#002060', whiteSpace: 'nowrap' }}>
                        R${f.valor_fixo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {/* ===== OBS ===== */}
          <div style={{ marginBottom: '6px', fontSize: '8pt' }}>
            {preview ? (
              <p style={{ margin: 0 }}>Obs: {obs}</p>
            ) : (
              <div>
                <label className="no-print" style={{ fontSize: '7pt', color: '#666', fontWeight: 'bold' }}>Observação:</label>
                <textarea value={obs} onChange={e => setObs(e.target.value)} rows={2}
                  style={{ ...inputS(), resize: 'vertical', marginTop: '2px' }} />
              </div>
            )}
          </div>

          {/* ===== FORNECEDOR ===== */}
          {!preview && (
            <div style={{ marginBottom: '6px' }}>
              <label className="no-print" style={{ fontSize: '7pt', color: '#666', fontWeight: 'bold' }}>Fornecedor (opcional):</label>
              <input value={fornecedor} onChange={e => setFornecedor(e.target.value)}
                placeholder='Ex: Tampas - Manoel Celso cobrar R$ 28,00 Por Unid.'
                style={{ ...inputS(), marginTop: '2px' }} />
            </div>
          )}
          {preview && fornecedor && (
            <p style={{ margin: '0 0 6px', fontSize: '8pt' }}>
              &nbsp;&nbsp;&nbsp;&nbsp; Fornecedor: "{fornecedor}"
            </p>
          )}

          {/* ===== TABELA PERCURSOS ===== */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', marginTop: '10px' }}>
            <thead>
              <tr>
                {['PERCURSOS', 'FRETE PESO', 'FRETE VALOR', 'TAXA', 'OUTROS'].map(h => (
                  <th key={h} style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '10pt', fontFamily: "'Times New Roman', Times, serif", textAlign: 'left' }}>
                    {h}
                  </th>
                ))}
                {!preview && <th className="no-print" style={{ border: '1px solid #000', padding: '3px', width: '28px' }} />}
              </tr>
            </thead>
            <tbody>
              {percursos.map((p, i) => (
                <tr key={i}>
                  {preview ? (
                    <>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '10pt', fontFamily: "'Times New Roman', Times, serif" }}>{p.percurso}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '10pt', fontFamily: "'Times New Roman', Times, serif" }}>{p.frete_peso}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '10pt', fontFamily: "'Times New Roman', Times, serif" }}>{p.frete_valor}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '10pt', fontFamily: "'Times New Roman', Times, serif" }}>{p.taxa}</td>
                      <td style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '10pt', fontFamily: "'Times New Roman', Times, serif" }}>{p.outros}</td>
                    </>
                  ) : (
                    <>
                      {(['percurso', 'frete_peso', 'frete_valor', 'taxa', 'outros'] as const).map(f => (
                        <td key={f} style={{ border: '1px solid #000', padding: '1px' }}>
                          <input value={p[f]} onChange={e => updP(i, f, e.target.value)}
                            placeholder={f === 'percurso' ? 'SP x Destino' : '—'}
                            style={{ width: '100%', border: 'none', padding: '3px 5px', fontSize: '9pt', fontFamily: "'Times New Roman', Times, serif", background: 'transparent' }} />
                        </td>
                      ))}
                      <td className="no-print" style={{ border: '1px solid #000', padding: '1px', textAlign: 'center' }}>
                        <button onClick={() => rmP(i)} title="Remover"
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12pt', lineHeight: 1 }}>×</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {!preview && (
            <button className="no-print" onClick={addP}
              style={{ background: '#eee', border: '1px solid #ccc', borderRadius: '2px', padding: '2px 8px', fontSize: '8pt', cursor: 'pointer', marginBottom: '10px' }}>
              + Adicionar Percurso
            </button>
          )}

          {/* ===== GENERALIDADES ===== */}
          <p style={{ margin: '12px 0 4px', fontSize: '8pt' }}><strong><u>GENERALIDADES</u></strong></p>
          <div style={{ border: '1px solid #000', padding: '6px 8px', marginBottom: '10px', fontSize: '8pt' }}>
            <p style={{ margin: '0 0 6px', textAlign: 'justify' }}>
              Taxas, pedágio, e outros tributos serão cobrados conf. Lei em vigor. As mercadorias confiadas a nossa Empresa viajam devidamente seguradas contra tombamento, saques ou assaltos a mão armada bem como em deposito na origem e destino, todas pela Tokio Marine. A presente cotação entra em vigor a partir {dataFormatada}. Condições de pagamento, <strong>
                {preview ? pagCond : (
                  <input value={pagCond} onChange={e => setPagCond(e.target.value)}
                    style={{ ...inputS('260px'), display: 'inline', fontWeight: 'bold' }} />
                )}
              </strong>.
            </p>
            <p style={{ margin: '0 0 6px', textAlign: 'justify' }}>
              Ciente de nossas especiais atenções antecipamos nosso agradecimento.
            </p>
            <p style={{ margin: 0 }}>
              <strong><u>A PRESENTE COTAÇÃO PERDE A VALIDADE APÓS{' '}
                {preview ? valDias : (
                  <input value={valDias} onChange={e => setValDias(e.target.value)}
                    style={{ width: '30px', textAlign: 'center', border: '1px dashed #999', borderRadius: '2px', padding: '0 2px', fontWeight: 'bold', fontSize: 'inherit', fontFamily: 'inherit', background: '#fffff0' }} />
                )}{' '}
                DIAS SEM MOVIMENTAÇÃO DE CARGAS.</u></strong>
            </p>
          </div>

          {/* ===== ASSINATURAS ===== */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', gap: '40px', fontSize: '8pt' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginTop: '30px' }}>
                <strong>F P TRANSPORTES</strong>
              </div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ borderTop: '1px solid #000', paddingTop: '4px', marginTop: '30px' }}>
                <span>{clienteNome}</span><br />
                <span style={{ fontSize: '7pt', color: '#555' }}>{cnpjF}</span>
              </div>
            </div>
          </div>

          {/* ===== FOOTER ===== */}
          <div style={{ borderTop: '1px solid #000', marginTop: '24px', paddingTop: '6px', textAlign: 'center', fontSize: '8pt', lineHeight: 1.6 }}>
            <p style={{ margin: 0 }}>
              <strong><em>Feira de Santana - BA</em></strong>&nbsp;&nbsp;
              <span style={{ fontFamily: 'Arial, sans-serif' }}>Rua Comendador. Gomes, 265 CJ Panorama -Tomba</span>&nbsp;&nbsp;
              <span style={{ fontFamily: 'Arial, sans-serif' }}>CEP- 44091-238</span>
            </p>
            <p style={{ margin: 0 }}><em>Fone-(75) 3614-4323 /3616-6155</em></p>
            <p style={{ margin: '4px 0 0' }}>
              <strong style={{ fontFamily: 'Arial, sans-serif', fontSize: '9pt' }}>Guarulhos - SP</strong>
              <span style={{ color: '#365f91' }}> - </span>
              <span style={{ fontFamily: 'Helvetica, Arial, sans-serif', color: '#1f497d', fontSize: '9pt' }}>Rua Gurjão, 16 – Cidade Industrial Satélite - CEP: 07224-040</span>
            </p>
            <p style={{ margin: 0, color: '#1f497d', fontFamily: 'Arial, sans-serif', fontSize: '9pt' }}>
              <strong>Contatos: (11) 2859-8420 /2411-1336&nbsp; (75)98162-2815 atendimentof.p.transcargas@gmail.com</strong>
            </p>
            <p style={{ margin: '4px 0 0' }}>
              <a href="mailto:f.p.transcargas@gmail.com" style={{ color: '#0000ff', textDecoration: 'underline', fontWeight: 'bold' }}>f.p.transcargas@gmail.com</a>
              <strong style={{ color: '#0000ff', textDecoration: 'underline' }}>&nbsp;&nbsp;&nbsp;/ comercial@fptranscargas.com.br</strong>
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12pt', fontWeight: 'bold', color: '#1f497d' }}>
              Disk Cotação (75) 3614-4323 / 9 8122-2015
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContratoEditor;
