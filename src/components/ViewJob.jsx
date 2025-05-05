import { useState } from "react";

export default function ViewJob({ job, onClose }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState({ ...job });

  const handleChange = (e, field) => {
    setEditedJob({
      ...editedJob,
      [field]: e.target.value
    });
  };

  const handleSave = () => {
    // Here you would typically call an API to save the changes
    setIsEditing(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-4/5 max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Job Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Job Number</label>
              <div className="mt-1 text-lg font-semibold">{job.id}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <div className="mt-1 text-lg">{job.date}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Customer</label>
              <div className="mt-1 text-lg">{job.customerCompany}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Contact</label>
              <div className="mt-1 text-lg">{job.customerContact}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Truck</label>
              <div className="mt-1 text-lg">{job.truck}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Status</label>
              <div className="mt-1 text-lg">{job.status}</div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Origin</label>
              <div className="mt-1 text-lg">{job.from}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Destination</label>
              <div className="mt-1 text-lg">{job.to}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Pickup Date</label>
              <div className="mt-1 text-lg">{job.pickupDate}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Delivery Date</label>
              <div className="mt-1 text-lg">{job.deliveryDate}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Time In/Out</label>
              <div className="mt-1 text-lg">{job.timeIn} - {job.timeOut}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Pro Number</label>
              <div className="mt-1 text-lg">{job.pro}</div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reference Number</label>
            <div className="mt-1 text-lg">{job.reference}</div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Details</label>
            <div className="mt-1 grid grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-500">Pieces:</span>
                <span className="ml-2 text-lg">{job.pcsCount}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Weight:</span>
                <span className="ml-2 text-lg">{job.weight} {job.unit}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Pallets:</span>
                <span className="ml-2 text-lg">{job.palletCount}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Zone:</span>
                <span className="ml-2 text-lg">{job.zone}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <div className="mt-1 p-4 bg-gray-50 rounded-lg">
              <p className="text-lg">{job.notes || "No notes available"}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {isEditing ? 'Cancel Edit' : 'Edit'}
          </button>
        </div>
      </div>
    </div>
  );
} 