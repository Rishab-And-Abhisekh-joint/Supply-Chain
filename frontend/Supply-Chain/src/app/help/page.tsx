'use client';

import React, { useState } from 'react';
import { 
  HelpCircle, Book, MessageCircle, Mail, Phone, 
  ChevronDown, ChevronUp, ExternalLink, Search,
  FileText, Video, Users, Zap
} from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    category: 'Getting Started',
    question: 'How do I upload my inventory data?',
    answer: 'Go to Settings > Data Management, then drag and drop your JSON files or configure your AWS S3 bucket. The system supports inventory.json, orders.json, warehouses.json, vehicles.json, and team.json files.'
  },
  {
    category: 'Getting Started',
    question: 'What file format should my data be in?',
    answer: 'All data files should be in JSON format. Each file should contain an array of objects with the required fields. See the Data Format Guide in the documentation for detailed schemas.'
  },
  {
    category: 'Inventory',
    question: 'How do I set up low stock alerts?',
    answer: 'Each inventory item has a minStock field. When the quantity falls below this threshold, the system automatically generates a low stock alert visible in the Notifications section.'
  },
  {
    category: 'Inventory',
    question: 'Can I import data from Excel?',
    answer: 'Currently, the system accepts JSON files directly. You can convert your Excel files to JSON using online converters or export as CSV and convert to JSON.'
  },
  {
    category: 'Logistics',
    question: 'How does vehicle tracking work?',
    answer: 'The Live Tracking Map shows real-time positions of your fleet. Vehicle positions are updated from your vehicles.json data or API. Each vehicle shows status (Moving, Delivering, Idle) and ETA.'
  },
  {
    category: 'Logistics',
    question: 'How do I dispatch a vehicle?',
    answer: 'Navigate to Logistics from the sidebar, select an idle vehicle, and assign it to a delivery route. The vehicle status will update automatically.'
  },
  {
    category: 'Orders',
    question: 'How do I create a new order?',
    answer: 'Click "New Order" from Quick Actions on the Dashboard or navigate to Orders > Create Order. Fill in customer details, select items from inventory, and submit.'
  },
  {
    category: 'Integration',
    question: 'How do I connect to AWS S3?',
    answer: 'Go to Settings > Data Management > AWS S3 tab. Enter your bucket name and select your AWS region. Make sure your bucket has CORS enabled and appropriate read permissions.'
  },
  {
    category: 'Integration',
    question: 'Can I connect to my own API?',
    answer: 'Yes! Go to Settings > Data Management > REST API tab. Enter your API base URL. Your API should provide endpoints like /api/inventory, /api/orders, etc.'
  },
];

const categories = ['All', 'Getting Started', 'Inventory', 'Logistics', 'Orders', 'Integration'];

export default function HelpSupportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-500 mt-2">Find answers to common questions and get help</p>
      </div>

      {/* Search */}
      <div className="relative max-w-xl mx-auto">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search for help..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
        />
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <a href="#faq" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-blue-100 rounded-lg">
            <HelpCircle className="w-6 h-6 text-blue-600" />
          </div>
          <span className="text-sm font-medium">FAQs</span>
        </a>
        <a href="#docs" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-green-100 rounded-lg">
            <Book className="w-6 h-6 text-green-600" />
          </div>
          <span className="text-sm font-medium">Documentation</span>
        </a>
        <a href="#contact" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-purple-100 rounded-lg">
            <MessageCircle className="w-6 h-6 text-purple-600" />
          </div>
          <span className="text-sm font-medium">Contact Us</span>
        </a>
        <a href="#videos" className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border shadow-sm hover:shadow-md transition">
          <div className="p-3 bg-orange-100 rounded-lg">
            <Video className="w-6 h-6 text-orange-600" />
          </div>
          <span className="text-sm font-medium">Video Tutorials</span>
        </a>
      </div>

      {/* FAQs */}
      <div id="faq" className="bg-white rounded-xl border shadow-sm">
        <div className="p-5 border-b">
          <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
        </div>
        
        {/* Category Filter */}
        <div className="p-4 border-b flex gap-2 flex-wrap">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="divide-y">
          {filteredFAQs.map((faq, index) => (
            <div key={index} className="p-4">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                className="w-full flex items-center justify-between text-left"
              >
                <div>
                  <span className="text-xs text-blue-600 font-medium">{faq.category}</span>
                  <h3 className="font-medium text-gray-900 mt-1">{faq.question}</h3>
                </div>
                {expandedFAQ === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {expandedFAQ === index && (
                <p className="mt-3 text-gray-600 text-sm leading-relaxed pl-0">
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
          {filteredFAQs.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              No FAQs found matching your search.
            </div>
          )}
        </div>
      </div>

      {/* Documentation */}
      <div id="docs" className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="text-xl font-semibold mb-4">Documentation</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="#" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium">Getting Started Guide</p>
              <p className="text-sm text-gray-500">Setup and configuration basics</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
          </a>
          <a href="#" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <Zap className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-medium">API Documentation</p>
              <p className="text-sm text-gray-500">REST API reference</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
          </a>
          <a href="#" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <Book className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium">Data Format Guide</p>
              <p className="text-sm text-gray-500">JSON schemas and examples</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
          </a>
          <a href="#" className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
            <Users className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium">User Management</p>
              <p className="text-sm text-gray-500">Roles and permissions</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 ml-auto" />
          </a>
        </div>
      </div>

      {/* Contact */}
      <div id="contact" className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="text-xl font-semibold mb-4">Contact Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Email</p>
              <p className="text-sm text-blue-600">support@supplychain.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-lg">
              <Phone className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Phone</p>
              <p className="text-sm text-green-600">+91 1800-123-4567</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Live Chat</p>
              <p className="text-sm text-purple-600">Available 24/7</p>
            </div>
          </div>
        </div>
      </div>

      {/* Video Tutorials */}
      <div id="videos" className="bg-white rounded-xl border shadow-sm p-5">
        <h2 className="text-xl font-semibold mb-4">Video Tutorials</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Platform Overview', 'Data Import Guide', 'Managing Inventory'].map((title, idx) => (
            <div key={idx} className="group cursor-pointer">
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center group-hover:bg-gray-300 transition">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Video className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="mt-2 font-medium text-gray-900">{title}</p>
              <p className="text-sm text-gray-500">5 min video</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
