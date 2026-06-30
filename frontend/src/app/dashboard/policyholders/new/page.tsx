'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { policyholdersAPI } from '../../../../lib/api';
import { useToast } from '../../../../lib/toast';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';

export default function NewPolicyholderPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', policy_number: '', policy_type: 'Auto Insurance',
    policy_start_date: '', policy_end_date: '', coverage_amount: '', premium_amount: '', address: '', state: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.full_name || !form.policy_number) {
      setError('Full name and policy number are required.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await policyholdersAPI.create({
        ...form,
        coverage_amount: form.coverage_amount ? parseFloat(form.coverage_amount) : null,
        premium_amount: form.premium_amount ? parseFloat(form.premium_amount) : null,
      });
      toast({ type: 'success', title: 'Policyholder added', description: `${form.full_name} is now on file.` });
      router.push('/dashboard/policyholders');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Failed to create policyholder.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/dashboard/policyholders" className="btn-secondary px-3 py-2.5">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white">Add Policyholder</h1>
          <p className="mt-0.5 text-sm text-slate-400">Register a new policy to file claims against.</p>
        </div>
      </div>

      <div className="card card-topline space-y-5 p-6">
        <Section title="Identity">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Full Name *">
              <input className="input-field" value={form.full_name} onChange={set('full_name')} />
            </Field>
            <Field label="Policy Number *">
              <input className="input-field" value={form.policy_number} onChange={set('policy_number')} />
            </Field>
            <Field label="Email">
              <input className="input-field" type="email" value={form.email} onChange={set('email')} />
            </Field>
            <Field label="Phone">
              <input className="input-field" value={form.phone} onChange={set('phone')} />
            </Field>
          </div>
        </Section>

        <Section title="Coverage">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Policy Type">
              <select className="input-field" value={form.policy_type} onChange={set('policy_type')}>
                <option>Auto Insurance</option>
                <option>Health Insurance</option>
                <option>Property Insurance</option>
                <option>Life Insurance</option>
                <option>Travel Insurance</option>
              </select>
            </Field>
            <Field label="State">
              <input className="input-field" value={form.state} onChange={set('state')} />
            </Field>
            <Field label="Coverage Amount (₦)">
              <input className="input-field" type="number" value={form.coverage_amount} onChange={set('coverage_amount')} />
            </Field>
            <Field label="Premium Amount (₦)">
              <input className="input-field" type="number" value={form.premium_amount} onChange={set('premium_amount')} />
            </Field>
            <Field label="Policy Start">
              <input className="input-field" type="date" value={form.policy_start_date} onChange={set('policy_start_date')} />
            </Field>
            <Field label="Policy End">
              <input className="input-field" type="date" value={form.policy_end_date} onChange={set('policy_end_date')} />
            </Field>
          </div>
          <Field label="Address">
            <input className="input-field" value={form.address} onChange={set('address')} />
          </Field>
        </Section>

        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <Link href="/dashboard/policyholders" className="btn-secondary flex-1">
            Cancel
          </Link>
          <button onClick={handleSubmit} disabled={isLoading} className="btn-primary flex-1">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Create Policyholder
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
