import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

function FAQ() {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const res = await fetch('/api/public/faqs');
                if (res.ok) {
                    const data = await res.json();
                    setFaqs(data);
                } else {
                    setError('Failed to load FAQs');
                }
            } catch (e) {
                setError('Error loading FAQs');
            } finally {
                setLoading(false);
            }
        };
        fetchFaqs();
    }, []);

    const toggleOpen = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    if (loading) return <div className="container mx-auto p-8 text-center">Loading FAQs...</div>;
    if (error) return <div className="container mx-auto p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="container mx-auto max-w-4xl p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h1>

            {faqs.length === 0 ? (
                <div className="text-center text-gray-500">No questions have been posted yet.</div>
            ) : (
                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={faq.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-200"
                        >
                            <button
                                onClick={() => toggleOpen(index)}
                                className="w-full text-left p-5 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors focus:outline-none"
                            >
                                <span className="font-bold text-lg text-gray-800 pr-4">{faq.question}</span>
                                {openIndex === index ? (
                                    <ChevronUp className="flex-shrink-0 text-accent" />
                                ) : (
                                    <ChevronDown className="flex-shrink-0 text-gray-400" />
                                )}
                            </button>

                            {openIndex === index && (
                                <div className="p-5 pt-0 text-gray-600 border-t border-gray-100 bg-gray-50/50">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="prose max-w-none whitespace-pre-line leading-relaxed flex-1">
                                            {faq.answer}
                                        </div>
                                        {faq.image_url && (
                                            <div className="md:w-1/3 flex-shrink-0 relative">
                                                <img
                                                    src={faq.image_url}
                                                    alt="Reference"
                                                    className="w-full h-full object-cover rounded-lg shadow-sm"
                                                    style={{ minHeight: '200px' }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default FAQ;
