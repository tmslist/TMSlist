import { useState, useEffect, useCallback } from 'react';

interface DoctorProfileEditorProps {
  doctorId?: string;
  initialData: {
    id: string;
    name: string;
    firstName: string | null;
    lastName: string | null;
    credential: string | null;
    title: string | null;
    school: string | null;
    yearsExperience: number | null;
    specialties: string[] | null;
    bio: string | null;
    imageUrl: string | null;
  } | null;
}

interface Education {
  id?: string;
  school: string;
  degree: string;
  year: string;
}

interface Certification {
  id?: string;
  boardName: string;
  certificationNumber: string;
  issueDate: string;
  expiryDate: string;
}

interface HospitalAffiliation {
  id?: string;
  hospitalName: string;
  department: string;
}

const SPECIALTY_OPTIONS = [
  'TMS Therapy', 'Neuropsychiatry', 'Depression', 'Anxiety', 'OCD', 'PTSD',
  'Bipolar Disorder', 'Schizophrenia', 'Addiction', 'Pain Management',
  'Neurology', 'Psychiatry', 'Psychology', 'Geriatric Psychiatry',
];

export default function DoctorProfileEditor({ doctorId, initialData }: DoctorProfileEditorProps) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [name, setName] = useState(initialData?.name || '');
  const [credential, setCredential] = useState(initialData?.credential || '');
  const [title, setTitle] = useState(initialData?.title || '');
  const [school, setSchool] = useState(initialData?.school || '');
  const [yearsExperience, setYearsExperience] = useState(initialData?.yearsExperience || '');
  const [bio, setBio] = useState(initialData?.bio || '');
  const [specialties, setSpecialties] = useState<string[]>(initialData?.specialties || []);
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');

  const [education, setEducation] = useState<Education[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [affiliations, setAffiliations] = useState<HospitalAffiliation[]>([]);
  const [insurance, setInsurance] = useState<string[]>([]);
  const [insuranceInput, setInsuranceInput] = useState('');

  const [npiInput, setNpiInput] = useState('');
  const [npiLoading, setNpiLoading] = useState(false);

  // TagInput helpers
  const addSpecialty = (s: string) => { if (s && !specialties.includes(s)) setSpecialties([...specialties, s]); };
  const removeSpecialty = (s: string) => setSpecialties(specialties.filter(x => x !== s));
  const addInsurance = () => {
    if (insuranceInput.trim() && !insurance.includes(insuranceInput.trim())) {
      setInsurance([...insurance, insuranceInput.trim()]);
      setInsuranceInput('');
    }
  };
  const removeInsurance = (s: string) => setInsurance(insurance.filter(x => x !== s));

  // Education
  const addEducation = () => setEducation([...education, { school: '', degree: '', year: '' }]);
  const removeEducation = (i: number) => setEducation(education.filter((_, idx) => idx !== i));
  const updateEducation = (i: number, field: keyof Education, value: string) => {
    const updated = [...education];
    updated[i] = { ...updated[i], [field]: value };
    setEducation(updated);
  };

  // Certifications
  const addCertification = () => setCertifications([...certifications, { boardName: '', certificationNumber: '', issueDate: '', expiryDate: '' }]);
  const removeCertification = (i: number) => setCertifications(certifications.filter((_, idx) => idx !== i));
  const updateCertification = (i: number, field: keyof Certification, value: string) => {
    const updated = [...certifications];
    updated[i] = { ...updated[i], [field]: value };
    setCertifications(updated);
  };

  // Hospital affiliations
  const addAffiliation = () => setAffiliations([...affiliations, { hospitalName: '', department: '' }]);
  const removeAffiliation = (i: number) => setAffiliations(affiliations.filter((_, idx) => idx !== i));
  const updateAffiliation = (i: number, field: keyof HospitalAffiliation, value: string) => {
    const updated = [...affiliations];
    updated[i] = { ...updated[i], [field]: value };
    setAffiliations(updated);
  };

  // NPI lookup
  const handleNpiLookup = async () => {
    if (!npiInput.match(/^\d{10}$/)) { setError('NPI must be exactly 10 digits'); return; }
    setNpiLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/auth/npi-lookup?npi=${npiInput}`);
      const data = await res.json();
      if (data.name) setName(data.name);
      if (data.school) setSchool(data.school);
    } catch {
      setError('NPI lookup failed');
    } finally {
      setNpiLoading(false);
    }
  };

  // Image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    if (doctorId) formData.append('doctorId', doctorId);
    try {
      const res = await fetch('/api/admin/upload-doctor-image', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) setImageUrl(data.url);
    } catch {
      setError('Image upload failed');
    }
  };

  // Save
  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, credential, title, school,
          yearsExperience: yearsExperience ? Number(yearsExperience) : null,
          bio, specialties, imageUrl,
          education, certifications, affiliations, insurance,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSuccess('Profile saved successfully');
    } catch {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <svg key={i} className={`w-4 h-4 ${i < rating ? 'text-amber-400' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  }

  return (
    <div className="space-y-6">
      {success && <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">{success}</div>}
      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">{error}</div>}

      {/* Profile Photo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h2>
        <div className="flex items-center gap-6">
          {imageUrl ? (
            <img src={imageUrl} alt="Doctor" className="w-24 h-24 rounded-xl object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          <div>
            <label className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
              Upload Photo
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
            <p className="text-xs text-gray-500 mt-2">JPEG, PNG, WebP up to 5MB</p>
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Dr. Jane Smith" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Credential</label>
            <input value={credential} onChange={e => setCredential(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="MD, PhD" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Chief Psychiatrist" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical School</label>
            <input value={school} onChange={e => setSchool(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Harvard Medical School" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label>
            <input type="number" value={yearsExperience} onChange={e => setYearsExperience(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="15" min="0" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">NPI Lookup</label>
            <div className="flex gap-2">
              <input value={npiInput} onChange={e => setNpiInput(e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="10-digit NPI" maxLength={10} />
              <button onClick={handleNpiLookup} disabled={npiLoading} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                {npiLoading ? '...' : 'Lookup'}
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Write a brief biography..." />
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Specialties</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {specialties.map(s => (
            <span key={s} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
              {s}
              <button onClick={() => removeSpecialty(s)} className="ml-1 hover:text-blue-900">&times;</button>
            </span>
          ))}
        </div>
        <select onChange={e => { addSpecialty(e.target.value); e.target.value = ''; }} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
          <option value="">Add specialty...</option>
          {SPECIALTY_OPTIONS.filter(o => !specialties.includes(o)).map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {/* Education */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Education</h2>
          <button onClick={addEducation} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">+ Add</button>
        </div>
        {education.length === 0 ? <p className="text-sm text-gray-500">No education entries added</p> : education.map((edu, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
            <input value={edu.school} onChange={e => updateEducation(i, 'school', e.target.value)} placeholder="School" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            <input value={edu.degree} onChange={e => updateEducation(i, 'degree', e.target.value)} placeholder="Degree" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            <input value={edu.year} onChange={e => updateEducation(i, 'year', e.target.value)} placeholder="Year" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            <button onClick={() => removeEducation(i)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
        ))}
      </div>

      {/* Certifications */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Board Certifications</h2>
          <button onClick={addCertification} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">+ Add</button>
        </div>
        {certifications.length === 0 ? <p className="text-sm text-gray-500">No certifications added</p> : certifications.map((cert, i) => (
          <div key={i} className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <input value={cert.boardName} onChange={e => updateCertification(i, 'boardName', e.target.value)} placeholder="Board Name" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            <input value={cert.certificationNumber} onChange={e => updateCertification(i, 'certificationNumber', e.target.value)} placeholder="Cert Number" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            <input value={cert.issueDate} onChange={e => updateCertification(i, 'issueDate', e.target.value)} placeholder="Issue Date" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            <div className="flex gap-2">
              <input value={cert.expiryDate} onChange={e => updateCertification(i, 'expiryDate', e.target.value)} placeholder="Expiry" className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
              <button onClick={() => removeCertification(i)} className="text-red-500 hover:text-red-700 text-sm">X</button>
            </div>
          </div>
        ))}
      </div>

      {/* Hospital Affiliations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Hospital Affiliations</h2>
          <button onClick={addAffiliation} className="px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">+ Add</button>
        </div>
        {affiliations.length === 0 ? <p className="text-sm text-gray-500">No affiliations added</p> : affiliations.map((aff, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <input value={aff.hospitalName} onChange={e => updateAffiliation(i, 'hospitalName', e.target.value)} placeholder="Hospital Name" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            <input value={aff.department} onChange={e => updateAffiliation(i, 'department', e.target.value)} placeholder="Department" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500" />
            <button onClick={() => removeAffiliation(i)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
          </div>
        ))}
      </div>

      {/* Insurance */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Insurance Accepted</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {insurance.map(s => (
            <span key={s} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700 border border-green-200">
              {s}
              <button onClick={() => removeInsurance(s)} className="ml-1 hover:text-green-900">&times;</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={insuranceInput} onChange={e => setInsuranceInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addInsurance())} placeholder="Add insurance..." className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          <button onClick={addInsurance} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Add</button>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={handleSave} disabled={saving} className="px-8 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-sm">
          {saving ? 'Saving...' : 'Save Profile'}
        </button>
      </div>
    </div>
  );
}
