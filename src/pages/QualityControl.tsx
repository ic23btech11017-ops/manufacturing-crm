import React, { useState, useEffect } from 'react';
import { ShieldCheck, Crosshair, AlertTriangle, Check, X } from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO } from 'date-fns';
import { actionButtonStyles, statusToneStyles } from '../utils/ui';
import { getQualityChecks, inspectQualityCheck, subscribeToDemoStore } from '../demo/store';

type QualityCheck = {
  id: number;
  work_order_id: number;
  item_sku: string;
  status: 'pending' | 'passed' | 'failed';
  defect_rate: number;
  notes: string;
  inspected_at: string | null;
};

export default function QualityControl() {
  const [activeTab, setActiveTab] = useState<'pending' | 'logs'>('pending');
  const [checks, setChecks] = useState<QualityCheck[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCheck, setSelectedCheck] = useState<QualityCheck | null>(null);
  const [formData, setFormData] = useState({ status: 'passed', defect_rate: '0', notes: '' });

  useEffect(() => {
    void fetchChecks();

    return subscribeToDemoStore(() => {
      void fetchChecks();
    });
  }, []);

  const fetchChecks = async () => {
    try {
      const checks = await getQualityChecks();
      setChecks(Array.isArray(checks) ? checks : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pendingChecks = checks.filter(c => c.status === 'pending');
  const loggedChecks = checks.filter(c => c.status !== 'pending');

  const avgDefect = loggedChecks.length > 0 
    ? loggedChecks.reduce((acc, c) => acc + c.defect_rate, 0) / loggedChecks.length 
    : 0;

  const passRate = loggedChecks.length > 0 
    ? (loggedChecks.filter(c => c.status === 'passed').length / loggedChecks.length) * 100 
    : 100;

  const handleInspect = (check: QualityCheck) => {
    setSelectedCheck(check);
    setFormData({ status: 'passed', defect_rate: '0', notes: '' });
    setIsModalOpen(true);
  };

  const submitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCheck) return;
    try {
      await inspectQualityCheck(selectedCheck.id, {
        status: formData.status as QualityCheck['status'],
        defect_rate: formData.defect_rate,
        notes: formData.notes
      });
      setIsModalOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Quality Assurance</h2>
          <p className="text-sm text-slate-500 font-medium">Production inspections and defect tracking</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg"><Crosshair className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Pending Inspections</p>
            <p className="text-2xl font-bold text-slate-900">{pendingChecks.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className={clsx("p-3 rounded-lg", avgDefect > 2 ? "bg-red-50 text-slate-900" : "bg-slate-50 border border-slate-200 text-slate-900")}><AlertTriangle className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Avg Defect Rate</p>
            <p className="text-2xl font-bold text-slate-900">{avgDefect.toFixed(1)}%</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg"><ShieldCheck className="w-6 h-6" /></div>
          <div>
            <p className="text-sm font-semibold text-slate-500">Passed Quality</p>
            <p className="text-2xl font-bold text-slate-900">{passRate.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 relative">
          <div className="flex gap-6 relative z-10 w-full sm:w-auto">
            <button 
              className={clsx("pb-4 -mb-4 font-semibold text-sm border-b-2 transition-colors", activeTab === 'pending' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('pending')}
            >
              Pending Inspections
            </button>
            <button 
              className={clsx("pb-4 -mb-4 font-semibold text-sm border-b-2 transition-colors", activeTab === 'logs' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-700")}
              onClick={() => setActiveTab('logs')}
            >
              Inspection Logs
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {activeTab === 'pending' ? (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Item SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {pendingChecks.map(check => (
                  <tr key={check.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">Work Order #{check.work_order_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-slate-500">{check.item_sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx("px-2.5 py-1 rounded-full text-[11px] font-bold uppercase", statusToneStyles.awaiting)}>AWAITING QA</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleInspect(check)}
                        className={clsx("px-4 py-1.5 rounded text-xs font-bold", actionButtonStyles.info)}
                      >
                        Inspect Batch
                      </button>
                    </td>
                  </tr>
                ))}
                {pendingChecks.length === 0 && !loading && (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">No active inspection data. Execute a work order to generate quality checks.</td></tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Source WO</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Item SKU</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Defect Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {loggedChecks.map(check => (
                  <tr key={check.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{check.inspected_at ? format(parseISO(check.inspected_at), 'MMM d, yyyy HH:mm') : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">WO-{check.work_order_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-slate-500">{check.item_sku}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{check.defect_rate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {check.status === 'passed' ? (
                         <span className={clsx("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase", statusToneStyles.passed)}><Check className="w-4 h-4"/> PASSED</span>
                      ) : (
                         <span className={clsx("inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase", statusToneStyles.failed)}><X className="w-4 h-4"/> FAILED</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 truncate max-w-[200px]">{check.notes}</td>
                  </tr>
                ))}
                {loggedChecks.length === 0 && !loading && (
                  <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-500">No inspection logs available.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Inspection Modal */}
      {isModalOpen && selectedCheck && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto w-full">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative z-10 bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <form onSubmit={submitInspection}>
              <div className="px-6 py-5 border-b border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">Log Inspection (WO-{selectedCheck.work_order_id})</h3>
                <p className="text-xs text-slate-500 font-mono mt-1">Item: {selectedCheck.item_sku}</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Result Status</label>
                  <select required className="block w-full rounded-md border border-slate-300 py-2.5 px-3 text-sm focus:ring-slate-900 bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="passed">Passed (Acceptable)</option>
                    <option value="failed">Failed (Requires Rework/Scrap)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Detected Defect Rate (%)</label>
                  <input required type="number" step="0.1" min="0" max="100" className="block w-full rounded-md border border-slate-300 py-2.5 px-3 text-sm focus:ring-slate-900" value={formData.defect_rate} onChange={e => setFormData({...formData, defect_rate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Inspection Notes</label>
                  <textarea rows={3} className="block w-full rounded-md border border-slate-300 py-2.5 px-3 text-sm focus:ring-slate-900" placeholder="E.g. Minor flash on edges, within tolerance." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
                </div>
              </div>
              <div className="bg-slate-50 px-6 py-4 flex justify-end gap-3 rounded-b-xl border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-200 border border-slate-300 bg-white">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 shadow-sm">Save Inspection</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
