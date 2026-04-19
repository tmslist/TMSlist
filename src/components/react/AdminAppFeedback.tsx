import { useState, useCallback, useMemo } from 'react';

interface FeedbackItem {
  id: string;
  userId: string | null;
  userName: string;
  platform: 'ios' | 'android';
  appVersion: string;
  rating: number; // 1-5
  category: 'bug_report' | 'feature_request' | 'general' | 'complaint' | 'compliment';
  subject: string;
  body: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  replied: boolean;
  repliedAt: string | null;
  replyText: string;
  createdAt: string;
  helpful: number;
}

const CATEGORY_LABELS: Record<FeedbackItem['category'], string> = {
  bug_report: 'Bug Report',
  feature_request: 'Feature Request',
  general: 'General',
  complaint: 'Complaint',
  compliment: 'Compliment',
};

const CATEGORY_COLORS: Record<FeedbackItem['category'], string> = {
  bug_report: 'bg-red-100 text-red-700',
  feature_request: 'bg-violet-100 text-violet-700',
  general: 'bg-gray-100 text-gray-700',
  complaint: 'bg-orange-100 text-orange-700',
  compliment: 'bg-emerald-100 text-emerald-700',
};

export default function AdminAppFeedback() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([
    {
      id: '1',
      userId: 'user_4k2m8',
      userName: 'Sarah M.',
      platform: 'ios',
      appVersion: '3.2.1',
      rating: 1,
      category: 'bug_report',
      subject: 'App crashes when booking appointment',
      body: 'Every time I try to book an appointment the app crashes. I have tried multiple times on iPhone 14. Very frustrated as I need to see a TMS provider urgently.',
      sentiment: 'negative',
      replied: false,
      repliedAt: null,
      replyText: '',
      createdAt: '2026-04-18T10:23:00Z',
      helpful: 0,
    },
    {
      id: '2',
      userId: 'user_7n3p5',
      userName: 'James K.',
      platform: 'android',
      appVersion: '3.2.0',
      rating: 5,
      category: 'compliment',
      subject: 'Best TMS finder app!',
      body: 'This app has made finding TMS providers so much easier. The search filters are perfect and the clinic details are always up to date. Thank you!',
      sentiment: 'positive',
      replied: true,
      repliedAt: '2026-04-17T15:44:00Z',
      replyText: 'Thank you so much for your kind words, James! We are thrilled to hear you are having a great experience. Please reach out if you ever need assistance.',
      createdAt: '2026-04-17T12:15:00Z',
      helpful: 12,
    },
    {
      id: '3',
      userId: 'user_2x9v1',
      userName: 'Maria L.',
      platform: 'ios',
      appVersion: '3.1.5',
      rating: 3,
      category: 'feature_request',
      subject: 'Please add insurance filter',
      body: 'It would be great if you could add an insurance provider filter. Many TMS treatments are expensive without insurance coverage.',
      sentiment: 'neutral',
      replied: true,
      repliedAt: '2026-04-16T11:30:00Z',
      replyText: 'Great suggestion, Maria! We have forwarded this to our product team. This is something we are actively working on for a future update.',
      createdAt: '2026-04-15T18:45:00Z',
      helpful: 8,
    },
    {
      id: '4',
      userId: 'user_5t7y3',
      userName: 'David R.',
      platform: 'android',
      appVersion: '3.2.0',
      rating: 2,
      category: 'complaint',
      subject: 'Map not loading properly',
      body: 'The map view shows clinics in the wrong locations. I drove 30 minutes to a clinic that was supposedly 5 minutes away. Very misleading.',
      sentiment: 'negative',
      replied: false,
      repliedAt: null,
      replyText: '',
      createdAt: '2026-04-18T08:30:00Z',
      helpful: 5,
    },
    {
      id: '5',
      userId: 'user_8f4h9',
      userName: 'Emma W.',
      platform: 'ios',
      appVersion: '3.2.1',
      rating: 4,
      category: 'general',
      subject: 'Suggestion for doctor profiles',
      body: 'Would love to see board certifications and years of experience displayed more prominently on doctor profiles. Otherwise love the app!',
      sentiment: 'positive',
      replied: false,
      repliedAt: null,
      replyText: '',
      createdAt: '2026-04-16T14:20:00Z',
      helpful: 3,
    },
    {
      id: '6',
      userId: 'user_1c6z2',
      userName: 'Robert T.',
      platform: 'android',
      appVersion: '3.1.9',
      rating: 1,
      category: 'bug_report',
      subject: 'Cannot log in with biometrics',
      body: 'Face ID login stopped working after the last update. Have to use password every time which is inconvenient.',
      sentiment: 'negative',
      replied: true,
      repliedAt: '2026-04-15T09:10:00Z',
      replyText: 'We apologize for the inconvenience. This was a known issue that was fixed in version 3.2.0. Please update your app and Face ID should work again.',
      createdAt: '2026-04-14T20:05:00Z',
      helpful: 15,
    },
    {
      id: '7',
      userId: null,
      userName: 'Anonymous',
      platform: 'ios',
      appVersion: '3.2.1',
      rating: 5,
      category: 'compliment',
      subject: 'Life-changing service',
      body: 'Found an amazing TMS provider near me through this app. The whole process from discovery to booking was seamless. Thank you TMS List!',
      sentiment: 'positive',
      replied: false,
      repliedAt: null,
      replyText: '',
      createdAt: '2026-04-17T16:50:00Z',
      helpful: 9,
    },
    {
      id: '8',
      userId: 'user_3m8k5',
      userName: 'Lisa P.',
      platform: 'android',
      appVersion: '3.2.0',
      rating: 2,
      category: 'complaint',
      subject: 'App very slow on older phone',
      body: 'App runs very slowly on my Pixel 4a. Takes forever to load clinic lists. Consider optimizing for older devices.',
      sentiment: 'negative',
      replied: false,
      repliedAt: null,
      replyText: '',
      createdAt: '2026-04-16T11:00:00Z',
      helpful: 2,
    },
  ]);

  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<string>('all');
  const [filterReplied, setFilterReplied] = useState<string>('all');
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const filteredFeedback = useMemo(() => {
    return feedback.filter(f => {
      if (filterCategory !== 'all' && f.category !== filterCategory) return false;
      if (filterPlatform !== 'all' && f.platform !== filterPlatform) return false;
      if (filterRating !== 'all' && f.rating !== parseInt(filterRating)) return false;
      if (filterReplied === 'replied' && !f.replied) return false;
      if (filterReplied === 'pending' && f.replied) return false;
      return true;
    });
  }, [feedback, filterCategory, filterPlatform, filterRating, filterReplied]);

  const stats = useMemo(() => {
    const total = feedback.length;
    const avgRating = (feedback.reduce((sum, f) => sum + f.rating, 0) / total).toFixed(1);
    const pending = feedback.filter(f => !f.replied).length;
    const byCategory = {
      bug_report: feedback.filter(f => f.category === 'bug_report').length,
      feature_request: feedback.filter(f => f.category === 'feature_request').length,
      compliment: feedback.filter(f => f.category === 'compliment').length,
      complaint: feedback.filter(f => f.category === 'complaint').length,
      general: feedback.filter(f => f.category === 'general').length,
    };
    const ratingBreakdown = [1, 2, 3, 4, 5].map(r => ({
      rating: r,
      count: feedback.filter(f => f.rating === r).length,
      percent: Math.round((feedback.filter(f => f.rating === r).length / total) * 100),
    }));
    return { total, avgRating, pending, byCategory, ratingBreakdown };
  }, [feedback]);

  const handleSendReply = useCallback(() => {
    if (!selectedFeedback || !replyText.trim()) return;
    setSendingReply(true);
    setTimeout(() => {
      setFeedback(prev =>
        prev.map(f => f.id === selectedFeedback.id ? {
          ...f,
          replied: true,
          repliedAt: new Date().toISOString(),
          replyText: replyText.trim(),
        } : f)
      );
      setSelectedFeedback(null);
      setReplyText('');
      setSendingReply(false);
    }, 600);
  }, [selectedFeedback, replyText]);

  function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
    const sz = size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <svg key={i} className={`${sz} ${i <= rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">In-App Feedback</h1>
          <p className="text-gray-500 mt-1">Review and respond to user-submitted app feedback</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
            {stats.pending} pending replies
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Total Feedback</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Average Rating</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-900">{stats.avgRating}</p>
            <StarRating rating={Math.round(parseFloat(stats.avgRating))} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Pending Replies</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-xs font-medium text-gray-500 uppercase">Response Rate</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{Math.round(((stats.total - stats.pending) / stats.total) * 100)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Rating Breakdown</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(r => {
              const breakdown = stats.ratingBreakdown.find(b => b.rating === r);
              return (
                <div key={r} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600 w-3">{r}</span>
                  <svg className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-amber-400 h-2 rounded-full"
                      style={{ width: `${breakdown?.percent || 0}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-500 w-8 text-right">{breakdown?.count || 0}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">By Category</h3>
          <div className="space-y-3">
            {Object.entries(stats.byCategory).map(([cat, count]) => (
              <div key={cat} className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${CATEGORY_COLORS[cat as FeedbackItem['category']]}`}>
                  {CATEGORY_LABELS[cat as FeedbackItem['category']]}
                </span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Sentiment Overview</h3>
          <div className="space-y-4">
            {([
              { label: 'Positive', count: feedback.filter(f => f.sentiment === 'positive').length, color: 'bg-emerald-500', bgColor: 'bg-emerald-50', textColor: 'text-emerald-700' },
              { label: 'Neutral', count: feedback.filter(f => f.sentiment === 'neutral').length, color: 'bg-gray-400', bgColor: 'bg-gray-50', textColor: 'text-gray-700' },
              { label: 'Negative', count: feedback.filter(f => f.sentiment === 'negative').length, color: 'bg-red-500', bgColor: 'bg-red-50', textColor: 'text-red-700' },
            ]).map(s => (
              <div key={s.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${s.textColor}`}>{s.label}</span>
                  <span className={`text-sm font-bold ${s.textColor}`}>{s.count}</span>
                </div>
                <div className={`w-full ${s.bgColor} rounded-full h-2`}>
                  <div
                    className={`${s.color} h-2 rounded-full`}
                    style={{ width: `${Math.round((s.count / stats.total) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mt-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select
            value={filterPlatform}
            onChange={e => setFilterPlatform(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
          >
            <option value="all">All Platforms</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
          <select
            value={filterRating}
            onChange={e => setFilterRating(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
          >
            <option value="all">All Ratings</option>
            {[5, 4, 3, 2, 1].map(r => (
              <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>
            ))}
          </select>
          <select
            value={filterReplied}
            onChange={e => setFilterReplied(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending Reply</option>
            <option value="replied">Replied</option>
          </select>
        </div>
      </div>

      {/* Feedback list */}
      <div className="space-y-4">
        {filteredFeedback.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:border-violet-200 transition-colors">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-violet-600">{item.userName.charAt(0)}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-semibold text-gray-900">{item.userName}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${CATEGORY_COLORS[item.category]}`}>
                    {CATEGORY_LABELS[item.category]}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    item.platform === 'ios' ? 'bg-gray-900 text-white' : 'bg-green-600 text-white'
                  }`}>
                    {item.platform.toUpperCase()}
                  </span>
                  <span className="px-2 py-0.5 text-xs font-medium text-gray-500">{item.appVersion}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                    item.replied ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.replied ? 'Replied' : 'Pending'}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{item.subject}</p>
                <p className="text-sm text-gray-600 mb-2">{item.body}</p>
                <div className="flex items-center gap-4">
                  <StarRating rating={item.rating} />
                  <span className="text-xs text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {item.helpful > 0 && (
                    <span className="text-xs text-gray-400">{item.helpful} found helpful</span>
                  )}
                </div>
                {item.replied && item.replyText && (
                  <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">Our Reply:</p>
                    <p className="text-sm text-gray-700">{item.replyText}</p>
                  </div>
                )}
              </div>
              <div>
                {!item.replied && (
                  <button
                    onClick={() => { setSelectedFeedback(item); setReplyText(''); }}
                    className="px-4 py-2 bg-violet-600 text-white text-xs font-medium rounded-lg hover:bg-violet-700 transition-colors"
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredFeedback.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No feedback matches your filters</p>
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Reply to Feedback</h2>
              <button onClick={() => setSelectedFeedback(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-900">{selectedFeedback.subject}</p>
              <p className="text-xs text-gray-500 mt-1">{selectedFeedback.body}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={5}
                placeholder="Type your response here..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-violet-500 focus:ring-violet-500"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSendReply}
                disabled={sendingReply || !replyText.trim()}
                className="px-5 py-2.5 bg-violet-600 text-white text-sm font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {sendingReply ? 'Sending...' : 'Send Reply'}
              </button>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
