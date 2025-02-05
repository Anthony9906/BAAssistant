import React from 'react';
import './Library.css';
import { FiHome, FiBox, FiClipboard, FiBarChart2, FiUsers, FiMap, FiLayers, FiFileText, FiCheckSquare, FiFlag } from 'react-icons/fi';

function Library() {
  const documentTypes = [
    {
      id: 1,
      title: "Research Plan",
      description: "Generate comprehensive research plans with objectives, methodologies, and timelines",
      icon: FiClipboard,
      color: "#3B82F6"
    },
    {
      id: 2,
      title: "Business Case Analysis",
      description: "Create detailed analysis of business cases with market insights and recommendations",
      icon: FiBarChart2,
      color: "#10B981"
    },
    {
      id: 3,
      title: "Research Report",
      description: "Compile research findings into well-structured and insightful reports",
      icon: FiFileText,
      color: "#6366F1"
    },
    {
      id: 4,
      title: "Project Initiation",
      description: "Generate project initiation documents with scope, objectives, and success criteria",
      icon: FiFlag,
      color: "#F59E0B"
    },
    {
      id: 5,
      title: "User Journey Analysis",
      description: "Map and analyze user journeys to identify touchpoints and opportunities",
      icon: FiMap,
      color: "#EC4899"
    },
    {
      id: 6,
      title: "Business Model Analysis",
      description: "Analyze business models with comprehensive market and competitive insights",
      icon: FiLayers,
      color: "#8B5CF6"
    },
    {
      id: 7,
      title: "Project Requirements",
      description: "Document detailed project requirements and specifications",
      icon: FiBox,
      color: "#14B8A6"
    },
    {
      id: 8,
      title: "Project Plan",
      description: "Create structured project plans with milestones and deliverables",
      icon: FiUsers,
      color: "#F97316"
    },
    {
      id: 9,
      title: "Project Closure Report",
      description: "Generate comprehensive project closure reports and evaluations",
      icon: FiCheckSquare,
      color: "#6B7280"
    }
  ];

  return (
    <div className="library-container">
      <div className="library-header">
        <h1>Document Generator</h1>
        <p className="library-subtitle">
          Create professional documents with AI-powered templates and insights
        </p>
        
        <div className="library-tabs">
          <button className="tab-item active">
            <FiHome className="tab-icon" />
            Home
          </button>
          <button className="tab-item">
            <FiBox className="tab-icon" />
            Generator
          </button>
        </div>
      </div>

      <div className="docs-generator">
        <div className="section-header">
          <h2>Document Templates</h2>
          <button className="view-all">View all</button>
        </div>

        <div className="docs-grid">
          {documentTypes.map((doc) => {
            const IconComponent = doc.icon;
            return (
              <div key={doc.id} className="doc-card">
                <div className="doc-icon" style={{ backgroundColor: `${doc.color}15` }}>
                  <IconComponent style={{ color: doc.color }} />
                </div>
                <h3>{doc.title}</h3>
                <p className="doc-description">{doc.description}</p>
                <div className="card-footer">
                  <button className="generate-btn">Generate</button>
                  <button className="more-btn">•••</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Library; 