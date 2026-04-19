import { useState, useEffect } from 'react';

interface Survey {
  id: string;
  doctorId: string;
  userId: string | null;
  surveyType: string;
  name: string;
  responses: Record<string, unknown> | null;
  score: number | null;
  completedAt: string | null;
  createdAt: string;
}

interface SurveyResponse {
  id: string;
  surveyId: string;
  questionKey: string;
  answer: string;
  score: number | null;
  createdAt: string;
}

interface SurveyForm {
  name: string;
  surveyType: string;
}

interface SurveyTemplate {
  name: string;
  type: string;
  description: string;
  questions: string[];
}

const SURVEY_TEMPLATES: SurveyTemplate[] = [
  {
    name: 'PHQ-9 Depression Screen',
    type: 'phq9',
    description: 'Patient Health Questionnaire for depression severity screening',
    questions: [
      'Little interest or pleasure in doing things',
      'Feeling down, depressed, or hopeless',
      'Trouble falling or staying asleep, or sleeping too much',
      'Feeling tired or having little energy',
      'Poor appetite or overeating',
      'Feeling bad about yourself — or that you are a failure',
      'Trouble concentrating on things',
      'Moving or speaking so slowly that other people could have noticed',
      'Thoughts that you would be better off dead or of hurting yourself',
    ],
  },
  {
    name: 'GAD-7 Anxiety Screen',
    type: 'gad7',
    description: 'Generalized Anxiety Disorder 7-item scale',
    questions: [
      'Feeling nervous, anxious, or on edge',
      'Not being able to stop or control worrying',
      'Worrying too much about different things',
      'Trouble relaxing',
      'Being so restless that it is hard to sit still',
      'Becoming easily annoyed or irritable',
      'Feeling afraid, as if something awful might happen',
    ],
  },
  {
    name: 'Treatment Satisfaction Survey',
    type: 'custom',
    description: 'Patient satisfaction and outcome survey for TMS treatment',
    questions: [
      'How would you rate your overall treatment experience?',
      'Did you notice improvement in your symptoms?',
      'How would you rate the clinical staff?',
      'Was the treatment explained clearly?',
      'Would you recommend this treatment to others?',
      'Any side effects experienced during treatment?',
    ],
  },
];

const SURVEY_TYPE_LABELS: Record<string, string> = {
  phq9: 'PHQ-9',
  gad7: 'GAD-7',
  custom: 'Custom Survey',
};

const SURVEY_TYPE_COLORS: Record<string, string> = {
  phq9: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  gad7: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  custom: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const SCORE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  minimal: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-300', label: 'Minimal' },
  mild: { bg: 'bg-yellow-100 dark:bg-yellow-900/40', text: 'text-yellow-700 dark:text-yellow-300', label: 'Mild' },
  moderate: { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', label: 'Moderate' },
  moderatelySevere: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-700 dark:text-red-300', label: 'Moderately Severe' },
  severe: { bg: 'bg-red-200 dark:bg-red-900/60', text: 'text-red-800 dark:text-red-200', label: 'Severe' },
};

const getPHQ9Severity = (score: number): typeof SCORE_COLORS[keyof typeof SCORE_COLORS] => {
  if (score <= 4) return SCORE_COLORS.minimal;
  if (score <= 9) return SCORE_COLORS.mild;
  if (score <= 14) return SCORE_COLORS.moderate;
  if (score <= 19) return SCORE_COLORS.moderatelySevere;
  return SCORE_COLORS.severe;
};

const getGAD7Severity = (score: number): typeof SCORE_COLORS[keyof typeof SCORE_COLORS] => {
  if (score <= 4) return SCORE_COLORS.minimal;
  if (score <= 9) return SCORE_COLORS.mild;
  if (score <= 14) return SCORE_COLORS.moderate;
  return SCORE_COLORS.severe;
};

const getSeverity = (type: string, score: number | null) => {
  if (score === null) return null;
  if (type === 'phq9') return getPHQ9Severity(score);
  if (type === 'gad7') return getGAD7Severity(score);
  return null;
};

interface DoctorSurveysProps {
  doctorId?: string;
}

export default function DoctorSurveys({ doctorId }: DoctorSurveysProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [viewingSurvey, setViewingSurvey] = useState<Survey | null>(null);
  const [viewingResponses, setViewingResponses] = useState<SurveyResponse[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const [form, setForm] = useState<SurveyForm>({
    name: '',
    surveyType: 'phq9',
  });

  useEffect(() => {
    if (!doctorId) { setLoading(false); return; }
    fetchSurveys();
  }, [doctorId]);

  const fetchSurveys = () => {
    fetch('/api/doctor/treatment-plans')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => setSurveys(d.surveys || []))
      .catch(() => setError('Failed to load surveys'))
      .finally(() => setLoading(false));
  };

  const showMsg = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.surveyType) {
      setError('Name and survey type are required');
      return;
    }
    setError('');
    try {
      const res = await fetch('/api/doctor/treatment-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, type: form.surveyType }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to create survey');
      }
      const data = await res.json();
      setSurveys(prev => [data, ...prev]);
      showMsg('Survey created successfully');
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create survey');
    }
  };

  const resetForm = () => {
    setForm({ name: '', surveyType: 'phq9' });
    setShowForm(false);
    setShowTemplates(false);
  };

  const applyTemplate = (template: SurveyTemplate) => {
    setForm({ name: template.name, surveyType: template.type });
    setShowTemplates(false);
    setShowForm(true);
  };

  const viewSurveyResponses = async (survey: Survey) => {
    setViewingSurvey(survey);
    setLoadingResponses(true);
    try {
      const res = await fetch(`/api/doctor/treatment-plans?surveyId=${survey.id}`);
      if (res.ok) {
        const data = await res.json();
        setViewingResponses(data.responses || []);
      }
    } catch {
      setError('Failed to load responses');
    } finally {
      setLoadingResponses(false);
    }
  };

  // Analytics data
  const surveyStats = surveys.reduce<Record<string, { total: number; avgScore: number | null; completed: number }>>((acc, s) => {
    const type = s.surveyType;
    if (!acc[type]) acc[type] = { total: 0, avgScore: null, completed: 0 };
    acc[type].total++;
    if (s.completedAt) acc[type].completed++;
    if (s.score !== null) {
      const prev = acc[type].avgScore;
      acc[type].avgScore = prev === null ? s.score : (prev + s.score) / 2;
    }
    return acc;
  }, {});

  const filteredSurveys = typeFilter === 'all'
    ? surveys
    : surveys.filter(s => s.surveyType === typeFilter);

  const uniqueTypes = [...new Set(surveys.map(s => s.surveyType))];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {msg && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg text-green-800 dark:text-green-200 text-sm">
          {msg}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => { setShowForm(true); setShowTemplates(false); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Survey
        </button>
        <button
          onClick={() => { setShowTemplates(!showTemplates); setShowForm(false); }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Survey Templates ({SURVEY_TEMPLATES.length})
        </button>
      </div>

      {/* Survey Templates */}
      {showTemplates && (
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Survey Templates</h3>
          <div className="space-y-4">
            {SURVEY_TEMPLATES.map(template => (
              <div key={template.name} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{template.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{template.description}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${SURVEY_TYPE_COLORS[template.type]}`}>
                    {SURVEY_TYPE_LABELS[template.type]}
                  </span>
                </div>
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Questions ({template.questions.length}):</p>
                  <ol className="text-xs text-gray-600 dark:text-gray-300 space-y-0.5 list-decimal list-inside">
                    {template.questions.slice(0, 4).map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                    {template.questions.length > 4 && (
                      <li className="text-gray-400 dark:text-gray-500 italic">+{template.questions.length - 4} more</li>
                    )}
                  </ol>
                </div>
                <button
                  onClick={() => applyTemplate(template)}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  Use Template
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Survey Form */}
      {showForm && (
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Create New Survey</h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Survey Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Monthly PHQ-9 Check-in"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Survey Type *</label>
                <select
                  value={form.surveyType}
                  onChange={e => setForm(f => ({ ...f, surveyType: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="phq9">PHQ-9 (Depression)</option>
                  <option value="gad7">GAD-7 (Anxiety)</option>
                  <option value="custom">Custom Survey</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                Create Survey
              </button>
              <button type="button" onClick={resetForm} className="px-5 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Survey Responses Modal */}
      {viewingSurvey && (
        <div className="mb-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{viewingSurvey.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Created {new Date(viewingSurvey.createdAt).toLocaleDateString()}
                {viewingSurvey.completedAt && ` · Completed ${new Date(viewingSurvey.completedAt).toLocaleDateString()}`}
              </p>
            </div>
            <button onClick={() => { setViewingSurvey(null); setViewingResponses([]); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {loadingResponses ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : viewingResponses.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No responses recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {viewingResponses.map((response, i) => (
                <div key={response.id} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{response.questionKey}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{response.answer}</p>
                    </div>
                    {response.score !== null && (
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Score: {response.score}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View Tabs */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-6">
        <div className="flex gap-1">
          {(['list', 'analytics'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}>
              {tab === 'list' ? 'Surveys' : 'Analytics'}
            </button>
          ))}
        </div>

        {activeTab === 'list' && (
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types ({surveys.length})</option>
            {uniqueTypes.map(t => (
              <option key={t} value={t}>{SURVEY_TYPE_LABELS[t] || t} ({surveys.filter(s => s.surveyType === t).length})</option>
            ))}
          </select>
        )}
      </div>

      {/* Survey List */}
      {activeTab === 'list' && (
        <div>
          {filteredSurveys.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No surveys found. Create your first survey above.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Survey Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Score</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSurveys.map(survey => {
                    const severity = getSeverity(survey.surveyType, survey.score);
                    return (
                      <tr key={survey.id} className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900 dark:text-white">{survey.name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SURVEY_TYPE_COLORS[survey.surveyType]}`}>
                            {SURVEY_TYPE_LABELS[survey.surveyType] || survey.surveyType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {survey.completedAt ? (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300">Completed</span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {survey.score !== null ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 dark:text-white">{survey.score}</span>
                              {severity && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severity.bg} ${severity.text}`}>
                                  {severity.label}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{new Date(survey.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => viewSurveyResponses(survey)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View Responses
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div>
          {Object.keys(surveyStats).length === 0 ? (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">No survey data for analytics yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(surveyStats).map(([type, stats]) => {
                  const def = SURVEY_TEMPLATES.find(t => t.type === type);
                  return (
                    <div key={type} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${SURVEY_TYPE_COLORS[type]}`}>
                          {SURVEY_TYPE_LABELS[type] || type}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{stats.total} total</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Completed</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{stats.completed} ({stats.total > 0 ? Math.round(stats.completed / stats.total * 100) : 0}%)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Avg Score</span>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {stats.avgScore !== null ? stats.avgScore.toFixed(1) : '—'}
                          </span>
                        </div>
                      </div>
                      {def && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 italic">{def.description}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Response Rate Bar */}
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Overall Response Rate</h4>
                {(() => {
                  const totalSurveys = surveys.length;
                  const totalCompleted = surveys.filter(s => s.completedAt).length;
                  const rate = totalSurveys > 0 ? (totalCompleted / totalSurveys) * 100 : 0;
                  return (
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <span>{totalCompleted} completed of {totalSurveys} distributed</span>
                        <span className="font-semibold">{rate.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
                        <div className="h-3 rounded-full bg-blue-500 transition-all" style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* PHQ-9 / GAD-7 Distribution */}
              {['phq9', 'gad7'].filter(type => surveyStats[type]).length > 0 && (
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Score Distribution</h4>
                  <div className="space-y-3">
                    {(['phq9', 'gad7'] as const).filter(type => surveyStats[type]).map(type => {
                      const typeSurveys = surveys.filter(s => s.surveyType === type && s.score !== null);
                      if (typeSurveys.length === 0) return null;
                      const getRange = (score: number, t: string) => {
                        if (t === 'phq9') {
                          if (score <= 4) return '0-4 (Minimal)';
                          if (score <= 9) return '5-9 (Mild)';
                          if (score <= 14) return '10-14 (Moderate)';
                          if (score <= 19) return '15-19 (Mod. Severe)';
                          return '20-27 (Severe)';
                        }
                        if (score <= 4) return '0-4 (Minimal)';
                        if (score <= 9) return '5-9 (Mild)';
                        if (score <= 14) return '10-14 (Moderate)';
                        return '15-21 (Severe)';
                      };
                      const ranges = typeSurveys.reduce<Record<string, number>>((acc, s) => {
                        const range = getRange(s.score!, type);
                        acc[range] = (acc[range] || 0) + 1;
                        return acc;
                      }, {});
                      const rangeColors: Record<string, string> = {
                        '0-4 (Minimal)': 'bg-green-500',
                        '5-9 (Mild)': 'bg-yellow-500',
                        '10-14 (Moderate)': 'bg-orange-500',
                        '15-19 (Mod. Severe)': 'bg-red-400',
                        '20-27 (Severe)': 'bg-red-600',
                        '15-21 (Severe)': 'bg-red-600',
                      };
                      return (
                        <div key={type}>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{SURVEY_TYPE_LABELS[type]}</p>
                          <div className="space-y-1.5">
                            {Object.entries(ranges).map(([range, count]) => (
                              <div key={range} className="flex items-center gap-3">
                                <span className="text-xs text-gray-600 dark:text-gray-300 w-20 shrink-0">{range}</span>
                                <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-5 relative">
                                  <div
                                    className={`h-5 rounded-full ${rangeColors[range] || 'bg-blue-500'}`}
                                    style={{ width: `${(count / typeSurveys.length) * 100}%` }}
                                  />
                                  <span className="absolute right-2 top-0.5 text-xs font-medium text-gray-700 dark:text-gray-200">{count}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
