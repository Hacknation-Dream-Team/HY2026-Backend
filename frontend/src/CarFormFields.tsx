import { useState, useEffect } from 'react';
import { api } from './api';

export function CarFormFields({ 
  carData, 
  onChange 
}: { 
  carData: any, 
  onChange: (data: any) => void 
}) {
  const [models, setModels] = useState<any[]>([]);
  const [brandSearch, setBrandSearch] = useState(carData.modelName ? carData.modelName.split(' ')[0] : '');
  const [modelSearch, setModelSearch] = useState(carData.modelName ? carData.modelName.substring(carData.modelName.indexOf(' ') + 1) : '');
  
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  useEffect(() => {
    api.getCarModels().then(setModels).catch(() => {});
  }, []);

  const brands = Array.from(new Set(models.map(m => m.brand)));
  const filteredBrands = brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));
  
  const brandModels = models.filter(m => m.brand === carData.brandStr);
  const filteredModels = brandModels.filter(m => m.model.toLowerCase().includes(modelSearch.toLowerCase()));

  const handleBrandSelect = (brand: string) => {
    setBrandSearch(brand);
    setShowBrandDropdown(false);
    onChange({ ...carData, brandStr: brand === 'Inny' ? null : brand, carModelId: null, modelName: null });
    setModelSearch('');
  };

  const handleModelSelect = (modelObj: any | 'Inny') => {
    if (modelObj === 'Inny') {
      setModelSearch('Inny');
      setShowModelDropdown(false);
      onChange({ ...carData, carModelId: null, modelName: brandSearch + ' Inny' });
    } else {
      setModelSearch(modelObj.model);
      setShowModelDropdown(false);
      onChange({ ...carData, carModelId: modelObj.id, modelName: null });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Marka</label>
        <input 
          type="text" 
          value={brandSearch} 
          onChange={e => {
            setBrandSearch(e.target.value);
            setShowBrandDropdown(true);
            onChange({ ...carData, brandStr: null, carModelId: null, modelName: e.target.value }); 
          }}
          onFocus={() => setShowBrandDropdown(true)}
          placeholder="np. Toyota" 
          className="input-field" 
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} 
        />
        {showBrandDropdown && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ced4da', borderRadius: '8px', zIndex: 10, maxHeight: '150px', overflowY: 'auto' }}>
            {filteredBrands.map(b => (
              <div key={b as string} onMouseDown={() => handleBrandSelect(b as string)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #e9ecef' }}>{b as string}</div>
            ))}
            <div onMouseDown={() => handleBrandSelect('Inny')} style={{ padding: '10px', cursor: 'pointer', fontStyle: 'italic' }}>Inny</div>
          </div>
        )}
      </div>

      <div style={{ position: 'relative' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Model</label>
        <input 
          type="text" 
          value={modelSearch} 
          onChange={e => {
            setModelSearch(e.target.value);
            setShowModelDropdown(true);
            onChange({ ...carData, carModelId: null, modelName: brandSearch + ' ' + e.target.value });
          }}
          onFocus={() => setShowModelDropdown(true)}
          placeholder="np. Yaris" 
          disabled={!carData.brandStr && brandSearch !== 'Inny'}
          className="input-field" 
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none', backgroundColor: (!carData.brandStr && brandSearch !== 'Inny') ? '#e9ecef' : 'white' }} 
        />
        {showModelDropdown && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #ced4da', borderRadius: '8px', zIndex: 10, maxHeight: '150px', overflowY: 'auto' }}>
            {filteredModels.map(m => (
              <div key={m.id} onMouseDown={() => handleModelSelect(m)} style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid #e9ecef' }}>{m.model}</div>
            ))}
            <div onMouseDown={() => handleModelSelect('Inny')} style={{ padding: '10px', cursor: 'pointer', fontStyle: 'italic' }}>Inny</div>
          </div>
        )}
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Numer rejestracyjny</label>
        <input 
          type="text" 
          value={carData.plate || ''} 
          onChange={e => onChange({ ...carData, plate: e.target.value })}
          placeholder="np. KR 12345" 
          className="input-field" 
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} 
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Kolor</label>
        <input 
          type="text" 
          value={carData.color || ''} 
          onChange={e => onChange({ ...carData, color: e.target.value })}
          placeholder="np. Srebrny" 
          className="input-field" 
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none' }} 
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 'bold' }}>Liczba miejsc dla pasażerów</label>
        <select 
          value={carData.passengerSeats || 3} 
          onChange={e => onChange({ ...carData, passengerSeats: parseInt(e.target.value) })}
          className="input-field" 
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ced4da', outline: 'none', backgroundColor: 'white' }}
        >
          <option value={1}>1</option>
          <option value={2}>2</option>
          <option value={3}>3</option>
        </select>
      </div>
    </div>
  );
}
