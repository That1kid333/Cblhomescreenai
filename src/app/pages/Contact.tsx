import { useState } from 'react';

export function Contact() {
  const [formData, setFormData] = useState({
    topic: '',
    fullName: '',
    email: '',
    phone: '',
    message: '',
    agreedToTerms: false,
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus('success');
        setFormData({
          topic: '',
          fullName: '',
          email: '',
          phone: '',
          message: '',
          agreedToTerms: false,
        });
      } else {
        setStatus('error');
        setErrorMessage(result.error || 'Failed to send message.');
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Network error. Please try again later.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  return (
    <main className="max-w-3xl mx-auto px-4 lg:px-6 py-8 lg:py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold leading-none mb-2 text-center">
          Contact Us
        </h1>
        <p className="text-[#FDB913] text-lg font-semibold">
          We're here to help! Submit your issue below.
        </p>
      </div>

      {/* Contact Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Topic Dropdown */}
        <div>
          <label htmlFor="topic" className="block text-white font-semibold mb-2">
            What can we help you with? <span className="text-[#FDB913]">*</span>
          </label>
          <select
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-[#0A0A0A] border-2 border-[#FDB913] rounded-lg text-white focus:outline-none focus:border-[#FDB913] transition-colors"
          >
            <option value="" disabled>Select a topic</option>
            <option value="general">General Inquiry</option>
            <option value="rider">Rider Support</option>
            <option value="driver">Driver Support</option>
            <option value="partnership">Partnership Inquiry</option>
            <option value="bug">Bug Report</option>
          </select>
        </div>

        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="block text-white font-semibold mb-2">
            Full Name <span className="text-[#FDB913]">*</span>
          </label>
          <input
            type="text"
            id="fullName"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-[#0A0A0A] border-2 border-[#FDB913] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition-colors"
            placeholder="Enter your full name"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-white font-semibold mb-2">
            Email <span className="text-[#FDB913]">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-[#0A0A0A] border-2 border-[#FDB913] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition-colors"
            placeholder="your.email@example.com"
          />
        </div>

        {/* Phone Number (Optional) */}
        <div>
          <label htmlFor="phone" className="block text-white font-semibold mb-2">
            Phone Number (optional)
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#0A0A0A] border-2 border-[#FDB913] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition-colors"
            placeholder="(555) 123-4567"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-white font-semibold mb-2">
            How can we help? <span className="text-[#FDB913]">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            rows={6}
            className="w-full px-4 py-3 bg-[#0A0A0A] border-2 border-[#FDB913] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#FDB913] transition-colors resize-none"
            placeholder="Please describe your issue or question..."
          />
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="agreedToTerms"
            name="agreedToTerms"
            checked={formData.agreedToTerms}
            onChange={handleChange}
            required
            className="mt-1 w-5 h-5 bg-[#0A0A0A] border-2 border-[#FDB913] rounded accent-[#FDB913] focus:outline-none focus:ring-2 focus:ring-[#FDB913] cursor-pointer"
          />
          <label htmlFor="agreedToTerms" className="text-gray-300 text-sm">
            I agree to the <a href="/terms" target="_blank" className="text-[#FDB913] hover:text-[#FDB913] underline">Terms and Conditions</a> <span className="text-[#FDB913]">*</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`w-full ${status === 'loading' ? 'bg-gray-500 cursor-not-allowed' : 'bg-[#FDB913] hover:bg-[#cc9410]'} text-black font-bold py-4 rounded-lg transition-colors text-lg`}
        >
          {status === 'loading' ? 'SENDING...' : 'SUBMIT'}
        </button>

        {status === 'success' && (
          <div className="bg-green-500/20 border border-green-500 text-green-400 p-4 rounded-lg text-center font-semibold">
            Your message has been sent! We have emailed you a confirmation.
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 p-4 rounded-lg text-center font-semibold">
            {errorMessage}
          </div>
        )}

        {/* Response Time Note */}
        <p className="text-center text-gray-400 text-sm mt-6">
          We typically respond within 24 hours
        </p>
      </form>
    </main>
  );
}
