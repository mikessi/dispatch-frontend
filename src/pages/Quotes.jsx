import { useState, useEffect } from "react";
import { calculateRate, calculateFuel, calculateTransferRate, calculatePTTRate, calculateExportAndTransferRate } from "../utils/rateCalculator";
import { accessoryCharges } from "../utils/accessoryCharges";

export default function Quotes() {
  const [formData, setFormData] = useState({
    weight: '',
    weightUnit: 'lbs',
    moveType: 'Import/Export',
    zone: 'A',
    transportMode: 'Air',
    selectedAccessories: [],
    accessoryQuantities: {},
    storageDays: {},
    customCharges: []
  });

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
    const charge = (roundedWeight / 100) * 25;
    // Round up to 2 decimal places
    return Math.ceil(charge * 100) / 100;
  };

  const calculateTHCCharge = (amount) => {
    // Round up to nearest 100
    const roundedAmount = Math.ceil(amount / 100) * 100;
    const charge = (roundedAmount / 100) * 15;
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

  useEffect(() => {
    if (formData.weight) {
      const weight = parseFloat(formData.weight);
      if (isNaN(weight)) return;

      let result;
      if (formData.moveType === 'Transfer') {
        result = calculateTransferRate(weight, formData.weightUnit);
        setQuoteResult(prev => ({
          ...prev,
          baseRate: result.rate,
          fuelSurcharge: result.fuel,
          toll: 0,
          total: result.rate + result.fuel + prev.accessoryTotal,
          exportRate: 0,
          exportFuel: 0,
          exportToll: 0,
          transferRate: result.rate,
          transferFuel: result.fuel
        }));
      } else if (formData.moveType === 'PTT') {
        result = calculatePTTRate(weight, formData.weightUnit);
        setQuoteResult(prev => ({
          ...prev,
          baseRate: result.rate,
          fuelSurcharge: 0,
          toll: 0,
          total: result.rate + prev.accessoryTotal,
          exportRate: 0,
          exportFuel: 0,
          exportToll: 0,
          transferRate: 0,
          transferFuel: 0
        }));
      } else if (formData.moveType === 'Export + Transfer') {
        const exportResult = calculateRate(formData.transportMode, formData.zone, weight, formData.weightUnit);
        const transferResult = calculateTransferRate(weight, formData.weightUnit);
        setQuoteResult(prev => ({
          ...prev,
          baseRate: exportResult.rate + transferResult.rate,
          fuelSurcharge: exportResult.fuel + transferResult.fuel,
          toll: exportResult.toll,
          total: exportResult.rate + exportResult.fuel + exportResult.toll + transferResult.rate + transferResult.fuel + prev.accessoryTotal,
          exportRate: exportResult.rate,
          exportFuel: exportResult.fuel,
          exportToll: exportResult.toll,
          transferRate: transferResult.rate,
          transferFuel: transferResult.fuel
        }));
      } else {
        result = calculateRate(formData.transportMode, formData.zone, weight, formData.weightUnit);
        setQuoteResult(prev => ({
          ...prev,
          baseRate: result.rate,
          fuelSurcharge: result.fuel,
          toll: result.toll,
          total: result.rate + result.fuel + result.toll + prev.accessoryTotal,
          exportRate: result.rate,
          exportFuel: result.fuel,
          exportToll: result.toll,
          transferRate: 0,
          transferFuel: 0
        }));
      }
    } else {
      setQuoteResult(prev => ({
        ...prev,
        baseRate: 0,
        fuelSurcharge: 0,
        toll: 0,
        total: prev.accessoryTotal,
        exportRate: 0,
        exportFuel: 0,
        exportToll: 0,
        transferRate: 0,
        transferFuel: 0
      }));
    }
  }, [formData]);

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
        return total + (minutes * 1);
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
  }, [formData.selectedAccessories, formData.accessoryQuantities, formData.storageDays, formData.customCharges]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'weight') {
      if (value === '' || /^\d*\.?\d*$/.test(value)) {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="p-1">
      <h1 className="text-2xl font-bold mb-2">Quotes</h1>
      <div className="bg-white shadow rounded-lg p-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight
              </label>
              <div className="flex">
                <input
                  type="text"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter weight"
                />
                <select
                  name="weightUnit"
                  value={formData.weightUnit}
                  onChange={handleChange}
                  className="rounded-r-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="lbs">lbs</option>
                  <option value="kg">kg</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Move Type
              </label>
              <select
                name="moveType"
                value={formData.moveType}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="Import/Export">Import/Export</option>
                <option value="Transfer">Transfer</option>
                <option value="PTT">PTT</option>
                <option value="Export + Transfer">Export + Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Zone
              </label>
              <select
                name="zone"
                value={formData.zone}
                onChange={handleChange}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
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
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Ocean</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Accessory Charges
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto p-2 border rounded-md">
                {Object.entries(accessoryCharges).map(([name, price]) => (
                  <div key={name} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <label className="flex items-center space-x-2 flex-1">
                      <input
                        type="checkbox"
                        checked={formData.selectedAccessories.includes(name)}
                        onChange={(e) => handleAccessoryChange(name, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm">
                        {name} {name !== "Empty Pallet" && name !== "Inside Delivery | per 100Lbs" && name !== "THC + Processing Fee per $100 Covered" && name !== "In/Out Charge" && name !== "Storage Charge $10/Pallet/Per Day" && name !== "Detention $60/Hour" && name !== "Volume Charge Per Pallet" && `($${price})`}
                      </span>
                    </label>
                    {name === "Empty Pallet" && formData.selectedAccessories.includes(name) && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={formData.accessoryQuantities[name] || ''}
                          onChange={(e) => handleQuantityChange(name, e.target.value)}
                          className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
                          className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
                          className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
                          className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                          placeholder="Pallets"
                        />
                        <input
                          type="text"
                          value={formData.storageDays[name] || ''}
                          onChange={(e) => handleStorageDaysChange(name, e.target.value)}
                          className="w-16 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
                          className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
                          className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
                          className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
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
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                        placeholder="Description"
                      />
                      <input
                        type="text"
                        value={charge.price}
                        onChange={(e) => handleCustomChargeChange(index, 'price', e.target.value)}
                        className="w-24 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
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

          <div className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Quote Summary</h2>
            <div className="space-y-2">
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
                          {accessory}
                          {accessory === "Empty Pallet" && ` (${formData.accessoryQuantities[accessory] || 0} × $${accessoryCharges[accessory]})`}
                          {accessory === "In/Out Charge" && ` (${formData.accessoryQuantities[accessory] || 0} × $${accessoryCharges[accessory]})`}
                          {accessory === "Volume Charge Per Pallet" && ` (${formData.accessoryQuantities[accessory] || 0} pallets × $${accessoryCharges[accessory]})`}
                          {accessory === "Inside Delivery | per 100Lbs" && ` (${formData.accessoryQuantities[accessory] || 0}lbs = $${calculateInsideDeliveryCharge(formData.accessoryQuantities[accessory] || 0)})`}
                          {accessory === "THC + Processing Fee per $100 Covered" && ` ($${formData.accessoryQuantities[accessory] || 0} → $${calculateTHCCharge(formData.accessoryQuantities[accessory] || 0)})`}
                          {accessory === "Storage Charge $10/Pallet/Per Day" && ` (${formData.accessoryQuantities[accessory] || 0} pallets × ${formData.storageDays[accessory] || 0} days × $${accessoryCharges[accessory]})`}
                          {accessory === "Detention $60/Hour" && ` (${formData.accessoryQuantities[accessory] || 0} minutes × $1)`}
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
                            ? (formData.accessoryQuantities[accessory] || 0) * 1
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