import { useState } from "react";
import RequireSignIn from "../components/RequireSignIn";
import { Card, Message, primaryButtonClass, dangerButtonClass } from "../components/ui";
import { useAddresses, useCustomers, useJobs, useTrucks } from "../context/DataContext";
import { addSampleData, removeSampleData } from "../utils/sampleData";

function SampleDataTools() {
  const customers = useCustomers();
  const addresses = useAddresses();
  const jobs = useJobs();
  const trucks = useTrucks();
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  const count = (collection) => collection.items.filter((item) => item.sample).length;
  const existing = { customers: count(customers), addresses: count(addresses), trucks: count(trucks), jobs: count(jobs) };
  const total = existing.customers + existing.addresses + existing.trucks + existing.jobs;

  const run = async (action, describe) => {
    setBusy(true);
    setMessage(null);
    try {
      setMessage({ type: 'success', text: describe(await action()) });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: `That didn’t work: ${error.message}` });
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = () =>
    run(addSampleData, (added) => `Added ${added.customers} customers, ${added.addresses} addresses, ${added.trucks} trucks and ${added.jobs} jobs.`);

  const handleRemove = () => {
    if (!window.confirm(`Remove all ${total} sample records? Your own records are not touched.`)) return;
    run(removeSampleData, (removed) => `Removed ${removed} sample records.`);
  };

  return (
    <div className="p-1 space-y-4 max-w-2xl">
      <h1 className="text-2xl font-bold">Sample data</h1>
      <Message message={message} />
      <Card>
        <p className="text-sm text-gray-700">
          Adds made-up customers, addresses, trucks and jobs so you can try the Dispatch Board, Jobs and Invoices
          without entering everything by hand. Jobs are spread from last week to about four weeks ahead.
        </p>
        <p className="text-sm text-gray-700 mt-2">
          Sample records sit alongside your real ones and show everywhere the real ones do, including the
          live site. Each is marked as sample, so <strong>Remove sample data</strong> deletes only those.
          Invoices you create from sample jobs are not removed.
        </p>
        <p className="text-sm text-gray-900 font-medium mt-4">
          Sample records right now: {existing.customers} customers · {existing.addresses} addresses · {existing.trucks} trucks · {existing.jobs} jobs
        </p>
        <div className="flex gap-3 mt-4">
          <button onClick={handleAdd} disabled={busy} className={primaryButtonClass}>
            {busy ? 'Working…' : total > 0 ? 'Add another set' : 'Add sample data'}
          </button>
          <button onClick={handleRemove} disabled={busy || total === 0} className={dangerButtonClass}>
            Remove sample data
          </button>
        </div>
      </Card>
    </div>
  );
}

export default function SampleData() {
  return (
    <RequireSignIn title="Sample data">
      <SampleDataTools />
    </RequireSignIn>
  );
}
