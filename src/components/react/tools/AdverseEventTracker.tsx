'use client';

import { useState } from 'react';
import {
  BoltIcon,
  FaceIcon,
  SkullIcon,
  EarIcon,
  SadIcon,
  WrenchIcon,
  ClipboardIcon,
  RedCircleIcon,
  WarningIcon,
  CheckCircleIcon,
  ShieldIcon,
  CheckIcon,
} from '../Icons';

type Severity = 1 | 2 | 3 | 4 | 5;

interface AdverseEvent {
  id: string;
  type: string;
  severity: Severity;
  date: string;
  protocol: string;
  description: string;
  resolved: boolean;
  reportedToFDA: boolean;
}

const EVENT_TYPES = [
  { label: 'Seizure', icon: BoltIcon, severity: 5, detail: 'Uncontrolled electrical activity in the brain. Requires immediate medical attention and protocol review.' },
  { label: 'Syncope / Fainting', icon: FaceIcon, severity: 4, detail: 'Sudden loss of consciousness. Monitor patient, stop session, assess vital signs.' },
  { label: 'Severe Headache', icon: SkullIcon, severity: 3, detail: 'Intense, disabling headache that does not resolve after session. May require intensity adjustment.' },
  { label: 'Hearing Loss / Tinnitus', icon: EarIcon, severity: 4, detail: 'New hearing changes after treatment. Check coil acoustic output and patient history.' },
  { label: 'Persistent Facial Twitching', icon: FaceIcon, severity: 3, detail: 'Ongoing facial muscle contractions after pulses stop. May indicate coil position needs adjustment.' },
  { label: 'Mood Deterioration', icon: SadIcon, severity: 3, detail: 'Significant worsening of depression or emergence of suicidal ideation. Urgent clinical review required.' },
  { label: 'Mania / Hypomania', icon: BoltIcon, severity: 4, detail: 'Elevated mood, energy, or agitation in a patient with depression. May indicate bipolar vulnerability.' },
  { label: 'Device Malfunction', icon: WrenchIcon, severity: 4, detail: 'Equipment failure during treatment. Document, inspect, and report to manufacturer.' },
];

const severityConfig: Record<Severity, { label: string; bg: string; text: string }> = {
  1: { label: 'Mild', bg: 'bg-amber-50', text: 'text-amber-700' },
  2: { label: 'Moderate', bg: 'bg-orange-50', text: 'text-orange-700' },
  3: { label: 'Significant', bg: 'bg-red-50', text: 'text-red-700' },
  4: { label: 'Severe', bg: 'bg-rose-100', text: 'text-rose-800' },
  5: { label: 'Life-threatening', bg: 'bg-red-200', text: 'text-red-900' },
};

export default function AdverseEventTracker() {
  const [events, setEvents] = useState<AdverseEvent[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<AdverseEvent>>({
    severity: 3,
    date: new Date().toISOString().split('T')[0],
    resolved: false,
    reportedToFDA: false,
  });

  const addEvent = () => {
    if (!newEvent.type || !newEvent.description) return;
    const event: AdverseEvent = {
      id: Date.now().toString(),
      type: newEvent.type,
      severity: (newEvent.severity || 3) as Severity,
      date: newEvent.date || new Date().toISOString().split('T')[0],
      protocol: newEvent.protocol || '',
      description: newEvent.description,
      resolved: newEvent.resolved || false,
      reportedToFDA: newEvent.reportedToFDA || false,
    };
    setEvents(prev => [event, ...prev]);
    setNewEvent({ severity: 3, date: new Date().toISOString().split('T')[0], resolved: false, reportedToFDA: false });
    setShowForm(false);
  };

  const toggleResolved = (id: string) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, resolved: !e.resolved } : e));
  };

  const deleteEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const unreported = events.filter(e => e.severity >= 4 && !e.reportedToFDA);
  const active = events.filter(e => !e.resolved);

  return (
    <div className="space-y-8">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events', value: events.length, Icon: ClipboardIcon, color: 'text-slate-700' },
          { label: 'Active (Unresolved)', value: active.length, Icon: RedCircleIcon, color: 'text-red-600' },
          { label: 'Severe Unreported', value: unreported.length, Icon: WarningIcon, color: 'text-amber-600' },
          { label: 'Resolved', value: events.filter(e => e.resolved).length, Icon: CheckCircleIcon, color: 'text-emerald-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
            <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Unreported severe events alert */}
      {unreported.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
          <div className="flex items-start gap-3">
            <WarningIcon className="text-amber-500" size={24} />
            <div>
              <p className="text-sm font-bold text-amber-700">Unreported Severe Events</p>
              <p className="text-sm text-slate-600 mt-1">
                {unreported.length} severe event(s) have not been reported to the FDA. Devices used in TMS must be reported per MedWatch (21 CFR Part 803).
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => setEvents(prev => prev.map(e =>
                    unreported.some(u => u.id === e.id) ? { ...e, reportedToFDA: true } : e
                  ))}
                  className="text-xs font-semibold px-4 py-2 bg-amber-200 text-amber-800 rounded-lg hover:bg-amber-300 transition-colors"
                >
                  Mark All as Reported
                </button>
                <a
                  href="https://www.fda.gov/safety/medical-product-safety-information"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors"
                >
                  Report to FDA (MedWatch) →
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Event log */}
      {events.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-700">Event Log</h3>
          {events.map(event => {
            const typeInfo = EVENT_TYPES.find(t => t.label === event.type);
            const sev = severityConfig[event.severity];
            return (
              <div key={event.id} className={`rounded-xl border p-5 ${event.resolved ? 'border-slate-100 opacity-60' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {typeInfo ? (() => { const IconC = typeInfo.icon; return <IconC className="text-slate-600 mt-0.5" size={20} />; })() : <ClipboardIcon className="text-slate-600 mt-0.5" size={20} />}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-bold text-slate-800">{event.type}</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
                          {sev.label}
                        </span>
                        {event.resolved && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Resolved</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{event.date}{event.protocol ? ` · ${event.protocol}` : ''}</p>
                      <p className="text-sm text-slate-600 mt-2">{event.description}</p>
                      {event.reportedToFDA && (
                        <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1"><CheckIcon size={12} /> Reported to FDA</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => toggleResolved(event.id)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                        event.resolved
                          ? 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      }`}
                    >
                      {event.resolved ? 'Reopen' : 'Resolve'}
                    </button>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-50 rounded-xl p-8 text-center border border-slate-100">
          <ShieldIcon className="text-slate-400 mx-auto mb-2" size={32} />
          <p className="text-sm font-bold text-slate-500">No adverse events logged</p>
          <p className="text-xs text-slate-400 mt-1">Use this tracker to document any unusual events during TMS treatment.</p>
        </div>
      )}

      {/* Add event form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-500 transition-colors"
        >
          + Log Adverse Event
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-700">Log New Event</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Event Type</label>
              <select
                value={newEvent.type || ''}
                onChange={e => setNewEvent(prev => ({ ...prev, type: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 outline-none"
              >
                <option value="">Select type...</option>
                {EVENT_TYPES.map(t => {
                  const IconComponent = t.icon;
                  return <option key={t.label} value={t.label}><IconComponent size={14} className="inline mr-1" />{t.label}</option>;
                })}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Severity (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={newEvent.severity || 3}
                onChange={e => setNewEvent(prev => ({ ...prev, severity: parseInt(e.target.value) as Severity }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date</label>
              <input
                type="date"
                value={newEvent.date || ''}
                onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Protocol in use</label>
              <input
                type="text"
                value={newEvent.protocol || ''}
                onChange={e => setNewEvent(prev => ({ ...prev, protocol: e.target.value }))}
                placeholder="e.g. Standard rTMS 10Hz"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Description</label>
            <textarea
              rows={3}
              value={newEvent.description || ''}
              onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe what happened, patient condition, actions taken..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-800 bg-white focus:ring-2 focus:ring-violet-500 outline-none resize-none text-sm"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={newEvent.resolved || false}
                onChange={e => setNewEvent(prev => ({ ...prev, resolved: e.target.checked }))}
                className="w-4 h-4 accent-violet-600"
              />
              Resolved at time of logging
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={newEvent.reportedToFDA || false}
                onChange={e => setNewEvent(prev => ({ ...prev, reportedToFDA: e.target.checked }))}
                className="w-4 h-4 accent-violet-600"
              />
              Reported to FDA
            </label>
          </div>
          <div className="flex gap-3">
            <button
              onClick={addEvent}
              disabled={!newEvent.type || !newEvent.description}
              className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Save Event
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-6 py-3 bg-slate-100 text-slate-600 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}