import { useState, useEffect, useCallback } from 'react';

export const useRates = (apiUrl) => {
    const [rates, setRates] = useState([]);
    const [activeRate, setActiveRate] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchRates = useCallback(async () => {
        setLoading(true);
        try {
            const resp = await fetch(`${apiUrl}/rates`);
            if (!resp.ok) throw new Error('Failed to fetch');
            const data = await resp.json();
            if (Array.isArray(data)) {
                setRates(data);
                if (data.length > 0 && !activeRate) {
                    setActiveRate(data[0]);
                }
            } else {
                setRates([]);
            }
        } catch (err) {
            console.error('Error fetching rates', err);
            setRates([]);
        } finally {
            setLoading(false);
        }
    }, [apiUrl, activeRate]);

    useEffect(() => {
        fetchRates();
    }, [fetchRates]);

    const addRate = async (rateToSave) => {
        const resp = await fetch(`${apiUrl}/rates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rateToSave)
        });
        
        if (!resp.ok) {
            const contentType = resp.headers.get('content-type');
            let errorMessage = 'Failed to save';

            if (contentType && contentType.includes('application/json')) {
                const errData = await resp.json();
                errorMessage = errData.error || errorMessage;
            } else {
                const textError = await resp.text();
                console.error('Non-JSON error response:', textError);
                errorMessage = `Server Error (${resp.status})`;
            }
            throw new Error(errorMessage);
        }
        await fetchRates();
    };

    const deleteRate = async (id) => {
        await fetch(`${apiUrl}/rates/${id}`, { method: 'DELETE' });
        await fetchRates();
    };

    const toggleRateActive = async (rate) => {
        await fetch(`${apiUrl}/rates/${rate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...rate, is_active: !rate.is_active })
        });
        await fetchRates();
    };

    return {
        rates,
        activeRate,
        setActiveRate,
        loading,
        fetchRates,
        addRate,
        deleteRate,
        toggleRateActive
    };
};
