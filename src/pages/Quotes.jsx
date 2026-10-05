import { useState, useEffect, useMemo } from "react";
import { DEFAULT_FUEL_PERCENT, EMPTY_QUOTE, calculateQuote } from "../utils/rateCalculator";
import { useRates } from "../context/RatesContext";
import { useCustomers } from "../context/DataContext";
import { customerRates, countRateOverrides } from "../utils/customerRates";
import CityZoneSearch from "../components/CityZoneSearch";
import { inputBase, inputClass, smallInputBase, labelClass, checkboxClass } from "../components/ui";

const DETENTION = "Detention $60/Hour";
const STORAGE = "Storage Charge $10/Pallet/Per Day";

const MARKUP_OPTIONS = [5, 10, 15, 20, 25];

export default function Quotes() {
  const { rates: standardRates } = useRates();
  const customers = useCustomers();
  const [customerId, setCustomerId] = useState('');
  const customer = customers.byId(customerId);
  // Standard rates, with the selected customer's custom rates on top
  const rates = useMemo(() => customerRates(standardRates, customer), [standardRates, customer]);
  const customRateCount = countRateOverrides(customer?.rateOverrides);
  const { accessoryCharges } = rates;

  // Keep the dollar amounts baked into these names in sync with the saved prices
  const accessoryLabel = (name) => {
    if (name === DETENTION) return `Detention $${accessoryCharges[DETENTION]}/Hour`;
    if (name === STORAGE) return `Storage Charge $${accessoryCharges[STORAGE]}/Pallet/Per Day`;
    return name;
  };

  const [formData, setFormData] = useState({
    weight: '',
    weightUnit: 'lbs',
    moveType: 'Import/Export',
    zone: 'A',
    transportMode: 'Air',
    fuelPercent: DEFAULT_FUEL_PERCENT,
    markupEnabled: false,
    markupPercent: 15,
    selectedAccessories: [],
    accessoryQuantities: {},
    storageDays: {},
    customCharges: []
  });

  const [notes, setNotes] = useState('');

  const [quoteResult, setQuoteResult] = useState({
    baseRate: 0,
    fuelSurcharge: 0,
    toll: 0,
    total: 0,
    exportRate: 0,
    exportFuel: 0,
    exportToll: 0,
    transferRate: 0,
    transferFuel: 0,
    accessoryTotal: 0
  });

  const handleAccessoryChange = (accessory, checked) => {
    setFormData(prev => {
      if (checked) {
        return {
          ...prev,
          selectedAccessories: [...prev.selectedAccessories, accessory],
          accessoryQuantities: {
            ...prev.accessoryQuantities,
            [accessory]: accessory === "Empty Pallet" || accessory === "In/Out Charge" ? 1 : 0
          },
          storageDays: {
            ...prev.storageDays,
            [accessory]: accessory === "Storage Charge $10/Pallet/Per Day" ? 1 : 0
          }
        };
      } else {
        const { [accessory]: removed, ...remainingQuantities } = prev.accessoryQuantities;
        const { [accessory]: removedDays, ...remainingDays } = prev.storageDays;
        return {
          ...prev,
          selectedAccessories: prev.selectedAccessories.filter(a => a !== accessory),
          accessoryQuantities: remainingQuantities,
          storageDays: remainingDays
        };
      }
    });
  };

  const handleQuantityChange = (accessory, quantity) => {
    if (quantity === '' || /^\d*$/.test(quantity)) {
      setFormData(prev => ({
        ...prev,
        accessoryQuantities: {
          ...prev.accessoryQuantities,
          [accessory]: quantity === '' ? '' : parseInt(quantity)
        }
      }));
    }
  };

  const handleStorageDaysChange = (accessory, days) => {
    if (days === '' || /^\d*$/.test(days)) {
      setFormData(prev => ({
        ...prev,
        storageDays: {
          ...prev.storageDays,
          [accessory]: days === '' ? '' : parseInt(days)
        }
      }));
    }
  };

  const calculateInsideDeliveryCharge = (weight) => {
    // Round to nearest 100, with 50 as the midpoint
    const roundedWeight = Math.round(weight / 100) * 100;
    const charge = (roundedWeight / 100) * accessoryCharges["Inside Delivery | per 100Lbs"];
    // Round up to 2 decimal places
    return Math.ceil(charge * 100) / 100;
  };

  const calculateTHCCharge = (amount) => {
    // Round up to nearest 100
    const roundedAmount = Math.ceil(amount / 100) * 100;
    const charge = (roundedAmount / 100) * accessoryCharges["THC + Processing Fee per $100 Covered"];
    // Round up to 2 decimal places
    return Math.ceil(charge * 100) / 100;
  };

  const handleCustomChargeChange = (index, field, value) => {
    if (field === 'price' && (value === '' || /^\d*\.?\d*$/.test(value))) {
      setFormData(prev => {
        const newCustomCharges = [...prev.customCharges];
        newCustomCharges[index] = {
          ...newCustomCharges[index],
          [field]: value
        };
        return {
          ...prev,
          customCharges: newCustomCharges
        };
      });
    } else if (field === 'description') {
      setFormData(prev => {
        const newCustomCharges = [...prev.customCharges];
        newCustomCharges[index] = {
          ...newCustomCharges[index],
          [field]: value
        };
        return {
          ...prev,
          customCharges: newCustomCharges
        };
      });
    }
  };

  const handleAddCustomCharge = () => {
    setFormData(prev => ({
      ...prev,
      customCharges: [...prev.customCharges, { description: '', price: '' }]
    }));
  };

  const handleRemoveCustomCharge = (index) => {
    setFormData(prev => ({
      ...prev,
      customCharges: prev.customCharges.filter((_, i) => i !== index)
    }));
  };

  // Markup raises the zone rates (MIN, per-lb tiers, MAX); Transfer and PTT are unaffected
  const rateMultiplier = formData.markupEnabled ? 1 + formData.markupPercent / 100 : 1;
  const markupApplies = formData.moveType === 'Import/Export' || formData.moveType === 'Export + Transfer';

  useEffect(() => {
    const weight = parseFloat(formData.weight);
    if (formData.weight && isNaN(weight)) return;

    const quote = formData.weight
      ? calculateQuote(rates, {
          moveType: formData.moveType,
          transportMode: formData.transportMode,
          zone: formData.zone,
          weight,
          weightUnit: formData.weightUnit,
          fuelPercent: formData.fuelPercent,
          rateMultiplier
        })
      : EMPTY_QUOTE;

    setQuoteResult(prev => ({
      ...prev,
      ...quote,
      total: quote.baseRate + quote.fuelSurcharge + quote.toll + prev.accessoryTotal
    }));
  }, [formData, rateMultiplier, rates]);

  useEffect(() => {
    const accessoryTotal = formData.selectedAccessories.reduce((total, accessory) => {
      const basePrice = accessoryCharges[accessory] || 0;
      if (accessory === "Empty Pallet" || accessory === "In/Out Charge" || accessory === "Volume Charge Per Pallet") {
        const quantity = formData.accessoryQuantities[accessory] || 0;
        return total + (basePrice * quantity);
      } else if (accessory === "Inside Delivery | per 100Lbs") {
        const weight = formData.accessoryQuantities[accessory] || 0;
        return total + calculateInsideDeliveryCharge(weight);
      } else if (accessory === "THC + Processing Fee per $100 Covered") {
        const amount = formData.accessoryQuantities[accessory] || 0;
        return total + calculateTHCCharge(amount);
      } else if (accessory === "Storage Charge $10/Pallet/Per Day") {
        const pallets = formData.accessoryQuantities[accessory] || 0;
        const days = formData.storageDays[accessory] || 0;
        return total + (basePrice * pallets * days);
      } else if (accessory === "Detention $60/Hour") {
        const minutes = formData.accessoryQuantities[accessory] || 0;
        return total + (minutes * accessoryCharges[DETENTION] / 60);
      } else if (accessory === "Custom") {
        return total;
      }
      return total + basePrice;
    }, 0);

    // Add custom charges to total
    const customTotal = formData.customCharges.reduce((total, charge) => {
      return total + (parseFloat(charge.price) || 0);
    }, 0);

    // Round up accessory total to 2 decimal places
    const roundedAccessoryTotal = Math.ceil((accessoryTotal + customTotal) * 100) / 100;

    setQuoteResult(prev => ({
      ...prev,
      accessoryTotal: roundedAccessoryTotal,
      total: Math.ceil((prev.baseRate + prev.fuelSurcharge + prev.toll + roundedAccessoryTotal) * 100) / 100
    }));
  }, [formData.selectedAccessories, formData.accessoryQuantities, formData.storageDays, formData.customCharges, accessoryCharges]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'weight') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else if (name === 'fuelPercent' || name === 'markupPercent') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else if (name === 'markupEnabled') {
      setFormData(prev => ({ ...prev, markupEnabled: e.target.checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="p-1">
      <h1 className="text-2xl font-bold mb-4">Quotes</h1>
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {customers.items.length > 0 && (
              <div>
                <label className={labelClass}>
                  Customer
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className={inputClass}
                >
                  <option value="">No customer (standard rates)</option>
                  {customers.items.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {customer && (
                  <p className="mt-1 text-xs text-gray-500">
                    {customRateCount > 0
                      ? `Using ${customRateCount} custom rate${customRateCount === 1 ? '' : 's'} for ${customer.name}.`
                      : `${customer.name} uses standard rates.`}
                  </p>
                )}
              </div>
            )}

            <CityZoneSearch onSelect={(zone) => setFormData(prev => ({ ...prev, zone }))} />

            <div>
              <label className={labelClass}>
                Weight
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className={`${inputBase} flex-1 min-w-0 rounded-r-none`}
                  placeholder="Enter weight"
                />
                <select
                  name="weightUnit"
                  value={formData.weightUnit}
                  onChange={handleChange}
                  className={`${inputBase} rounded-l-none border-l-0`}
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Move Type
              </label>
              <select
                name="moveType"
                value={formData.moveType}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="Import/Export">Import/Export</option>
                <option value="Transfer">Transfer</option>
                <option value="PTT">PTT</option>
                <option value="Export + Transfer">Export + Transfer</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Zone
              </label>
              <select
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                className={inputClass}
                disabled={formData.moveType === 'Transfer' || formData.moveType === 'PTT'}
              >
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
                <option value="F">F</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Fuel Surcharge
              </label>
              <select
                name="fuelPercent"
                value={formData.fuelPercent}
                onChange={handleChange}
                className={inputClass}
                disabled={formData.moveType === 'PTT'}
              >
                {Array.from({ length: 31 }, (_, i) => 20 + i).map(percent => (
                  <option key={percent} value={percent}>{percent}%</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Markup
              </label>
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="markupEnabled"
                    checked={formData.markupEnabled}
                    onChange={handleChange}
                    disabled={!markupApplies}
                    className={checkboxClass}
                  />
                  Apply markup
                </label>
                <select
                  name="markupPercent"
                  value={formData.markupPercent}
                  onChange={handleChange}
                  disabled={!markupApplies || !formData.markupEnabled}
                  className={`${inputBase} flex-1`}
                >
                  {MARKUP_OPTIONS.map(percent => (
                    <option key={percent} value={percent}>{percent}%</option>
                  ))}
                </select>
              </div>
              {!markupApplies && (
                <p className="mt-1 text-xs text-gray-500">Markup only applies to zone rates (Import/Export, Export + Transfer).</p>
              )}
            </div>

            <div>
              <label className={labelClass}>
                Transport Mode
              </label>
              <div className="flex space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="transportMode"
                    value="Air"
                    checked={formData.transportMode === 'Air'}
                    onChange={handleChange}
                    className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Air</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="transportMode"
                    value="Ocean"
                    checked={formData.transportMode === 'Ocean'}
                    onChange={handleChange}
                    className="h-4 w-4 border-gray-300 text-purple-600 focus:ring-purple-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Ocean</span>
                </label>
              </div>
            </div>

            <div>
              <label className={labelClass}>
                Accessory Charges
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto p-2 border border-gray-300 rounded-lg">
                {Object.entries(accessoryCharges).map(([name, price]) => (
                  <div key={name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <label className="flex items-center space-x-2 flex-1">
                      <input
                        type="checkbox"
                        checked={formData.selectedAccessories.includes(name)}
                        onChange={(e) => handleAccessoryChange(name, e.target.checked)}
                        className={checkboxClass}
                      />
                      <span className="text-sm">
                        {accessoryLabel(name)} {name !== "Empty Pallet" && name !== "Inside Delivery | per 100Lbs" && name !== "THC + Processing Fee per $100 Covered" && name !== "In/Out Charge" && name !== "Storage Charge $10/Pallet/Per Day" && name !== "Detention $60/Hour" && name !== "Volume Charge Per Pallet" && `($${price})`}
                      </span>
                    </label>
                    {name === "Empty Pallet" && formData.selectedAccessories.includes(name) && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={formData.accessoryQuantities[name] || ''}
                          onChange={(e) => handleQuantityChange(name, e.target.value)}
                          className={`${smallInputBase} w-16`}
                          placeholder="Qty"
                        />
                        <span className="text-sm text-gray-500">× ${price}</span>
                      </div>
                    )}
                    {name === "In/Out Charge" && formData.selectedAccessories.includes(name) && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={formData.accessoryQuantities[name] || ''}
                          onChange={(e) => handleQuantityChange(name, e.target.value)}
                          className={`${smallInputBase} w-16`}
                          placeholder="Qty"
                        />
                        <span className="text-sm text-gray-500">× ${price}</span>
                      </div>
                    )}
                    {name === "Volume Charge Per Pallet" && formData.selectedAccessories.includes(name) && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={formData.accessoryQuantities[name] || ''}
                          onChange={(e) => handleQuantityChange(name, e.target.value)}
                          className={`${smallInputBase} w-16`}
                          placeholder="Pallets"
                        />
                        <span className="text-sm text-gray-500">× ${price}</span>
                      </div>
                    )}
                    {name === "Storage Charge $10/Pallet/Per Day" && formData.selectedAccessories.includes(name) && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={formData.accessoryQuantities[name] || ''}
                          onChange={(e) => handleQuantityChange(name, e.target.value)}
                          className={`${smallInputBase} w-16`}
                          placeholder="Pallets"
                        />
                        <input
                          type="text"
                          value={formData.storageDays[name] || ''}
                          onChange={(e) => handleStorageDaysChange(name, e.target.value)}
                          className={`${smallInputBase} w-16`}
                          placeholder="Days"
                        />
                        <span className="text-sm text-gray-500">× ${price}/day</span>
                      </div>
                    )}
                    {name === "Inside Delivery | per 100Lbs" && formData.selectedAccessories.includes(name) && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={formData.accessoryQuantities[name] || ''}
                          onChange={(e) => handleQuantityChange(name, e.target.value)}
                          className={`${smallInputBase} w-24`}
                          placeholder="Weight (lbs)"
                        />
                        <span className="text-sm text-gray-500">× $25/100lbs</span>
                      </div>
                    )}
                    {name === "THC + Processing Fee per $100 Covered" && formData.selectedAccessories.includes(name) && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={formData.accessoryQuantities[name] || ''}
                          onChange={(e) => handleQuantityChange(name, e.target.value)}
                          className={`${smallInputBase} w-24`}
                          placeholder="Amount ($)"
                        />
                        <span className="text-sm text-gray-500">× $15/100</span>
                      </div>
                    )}
                    {name === "Detention $60/Hour" && formData.selectedAccessories.includes(name) && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={formData.accessoryQuantities[name] || ''}
                          onChange={(e) => handleQuantityChange(name, e.target.value)}
                          className={`${smallInputBase} w-24`}
                          placeholder="Minutes"
                        />
                        <span className="text-sm text-gray-500">× $1/min</span>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Custom Charges Section */}
                <div className="col-span-2 p-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.selectedAccessories.includes("Custom")}
                        onChange={(e) => handleAccessoryChange("Custom", e.target.checked)}
                        className={checkboxClass}
                      />
                      <span className="text-sm font-medium">Custom Charges</span>
                    </label>
                    {formData.selectedAccessories.includes("Custom") && (
                      <button
                        onClick={handleAddCustomCharge}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Custom Charge
                      </button>
                    )}
                  </div>
                  
                  {formData.selectedAccessories.includes("Custom") && formData.customCharges.map((charge, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2 pl-6">
                      <input
                        type="text"
                        value={charge.description}
                        onChange={(e) => handleCustomChargeChange(index, 'description', e.target.value)}
                        className={`${smallInputBase} flex-1 min-w-0`}
                        placeholder="Description"
                      />
                      <input
                        type="text"
                        value={charge.price}
                        onChange={(e) => handleCustomChargeChange(index, 'price', e.target.value)}
                        className={`${smallInputBase} w-24`}
                        placeholder="Price"
                      />
                      <button
                        onClick={() => handleRemoveCustomCharge(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 border-b border-gray-200 pb-3 mb-4">Quote Summary</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`${inputClass} mb-4 bg-white`}
              placeholder="Notes"
            />
            <div className="space-y-2">
              {customer && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{customer.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Weight:</span>
                <span className="font-medium">{formData.weight} {formData.weightUnit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Move Type:</span>
                <span className="font-medium">{formData.moveType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Zone:</span>
                <span className="font-medium">{formData.zone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transport Mode:</span>
                <span className="font-medium">{formData.transportMode}</span>
              </div>
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between">
                <span className="text-gray-600">Base Rate:</span>
                <span className="font-medium">${quoteResult.baseRate.toFixed(2)}</span>
              </div>
              {formData.moveType !== 'PTT' && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Fuel Surcharge:</span>
                  <span className="font-medium">${quoteResult.fuelSurcharge.toFixed(2)}</span>
                </div>
              )}
              {(formData.moveType === 'Import/Export' || formData.moveType === 'Export + Transfer') && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Toll:</span>
                  <span className="font-medium">${quoteResult.toll.toFixed(2)}</span>
                </div>
              )}
              {formData.moveType === 'Export + Transfer' && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="text-sm text-gray-500 mb-2">Breakdown:</div>
                  <div className="pl-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Export Rate:</span>
                      <span className="font-medium">${quoteResult.exportRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Export Fuel:</span>
                      <span className="font-medium">${quoteResult.exportFuel.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Export Toll:</span>
                      <span className="font-medium">${quoteResult.exportToll.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transfer Rate:</span>
                      <span className="font-medium">${quoteResult.transferRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transfer Fuel:</span>
                      <span className="font-medium">${quoteResult.transferFuel.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
              {formData.selectedAccessories.length > 0 && (
                <>
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="text-sm text-gray-500 mb-2">Accessory Charges:</div>
                  {formData.selectedAccessories.map(accessory => {
                    if (accessory === "Custom") return null;
                    return (
                      <div key={accessory} className="flex justify-between pl-4">
                        <span className="text-gray-600">
                          {accessoryLabel(accessory)}
                          {accessory === "Empty Pallet" && ` (${formData.accessoryQuantities[accessory] || 0} × $${accessoryCharges[accessory]})`}
                          {accessory === "In/Out Charge" && ` (${formData.accessoryQuantities[accessory] || 0} × $${accessoryCharges[accessory]})`}
                          {accessory === "Volume Charge Per Pallet" && ` (${formData.accessoryQuantities[accessory] || 0} pallets × $${accessoryCharges[accessory]})`}
                          {accessory === "Inside Delivery | per 100Lbs" && ` (${formData.accessoryQuantities[accessory] || 0}lbs = $${calculateInsideDeliveryCharge(formData.accessoryQuantities[accessory] || 0)})`}
                          {accessory === "THC + Processing Fee per $100 Covered" && ` ($${formData.accessoryQuantities[accessory] || 0} → $${calculateTHCCharge(formData.accessoryQuantities[accessory] || 0)})`}
                          {accessory === "Storage Charge $10/Pallet/Per Day" && ` (${formData.accessoryQuantities[accessory] || 0} pallets × ${formData.storageDays[accessory] || 0} days × $${accessoryCharges[accessory]})`}
                          {accessory === "Detention $60/Hour" && ` (${formData.accessoryQuantities[accessory] || 0} minutes × $${(accessoryCharges[DETENTION] / 60).toFixed(2)})`}
                        </span>
                        <span className="font-medium">
                          ${(accessory === "Empty Pallet" || accessory === "In/Out Charge" || accessory === "Volume Charge Per Pallet"
                            ? (formData.accessoryQuantities[accessory] || 0) * accessoryCharges[accessory]
                            : accessory === "Inside Delivery | per 100Lbs"
                            ? calculateInsideDeliveryCharge(formData.accessoryQuantities[accessory] || 0)
                            : accessory === "THC + Processing Fee per $100 Covered"
                            ? calculateTHCCharge(formData.accessoryQuantities[accessory] || 0)
                            : accessory === "Storage Charge $10/Pallet/Per Day"
                            ? (formData.accessoryQuantities[accessory] || 0) * (formData.storageDays[accessory] || 0) * accessoryCharges[accessory]
                            : accessory === "Detention $60/Hour"
                            ? (formData.accessoryQuantities[accessory] || 0) * accessoryCharges[DETENTION] / 60
                            : accessoryCharges[accessory]
                          ).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                  
                  {/* Custom Charges in Summary */}
                  {formData.selectedAccessories.includes("Custom") && formData.customCharges.map((charge, index) => (
                    <div key={`custom-${index}`} className="flex justify-between pl-4">
                      <span className="text-gray-600">
                        {charge.description}
                      </span>
                      <span className="font-medium">
                        ${(parseFloat(charge.price) || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  
                  <div className="flex justify-between pl-4 font-medium">
                    <span className="text-gray-600">Accessory Total:</span>
                    <span>${quoteResult.accessoryTotal.toFixed(2)}</span>
                  </div>
                </>
              )}
              <div className="border-t border-gray-200 my-2"></div>
              <div className="flex justify-between font-bold text-lg">
                <span className="text-gray-900">Total:</span>
                <span className="text-blue-600">${quoteResult.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 