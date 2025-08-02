# BlogFlow - Universal Blog Management & Publishing Platform

A modern, open-source blog management tool that lets you write, edit, and publish articles to multiple platforms from a single interface. Built with FastAPI and featuring a beautiful markdown editor with live preview.

## 🌟 Features

### **📝 Content Management**
- **Rich Markdown Editor**: Write and edit articles with live preview
- **Draft Management**: Auto-save drafts and version history
- **File Upload**: Drag and drop markdown files or browse to upload
- **Article History**: Track all your articles with creation, update, and publish timestamps
- **Tag Management**: Organize articles with custom tags

### **🎨 Modern Interface**
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Clean UI**: Intuitive interface with Medium-inspired design
- **Real-time Preview**: See how your article will look as you write
- **Smart Notifications**: Elegant bottom-right notifications with transparency

### **📤 Multi-Platform Publishing**
- **Medium Integration**: Publish directly to Medium as draft, public, or unlisted
- **Extensible Architecture**: Easy to add new publishing platforms
- **API-First Design**: Built for extensibility and automation

### **🔧 Developer Friendly**
- **FastAPI Backend**: Modern, fast Python web framework
- **TinyDB Storage**: Lightweight, document-oriented database
- **RESTful API**: Clean endpoints for integration
- **Open Source**: MIT licensed for community contributions

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Medium API token (for Medium publishing)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/blogflow.git
   cd blogflow
   ```

2. **Set up virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Medium API token
   ```

5. **Run the application**
   ```bash
   python main.py
   ```

6. **Open your browser**
   Navigate to `http://localhost:8000`

## 📖 Usage

### **Writing Articles**
1. **Upload a markdown file** or start writing in the editor
2. **Edit content** with live preview
3. **Add tags** and set publish status
4. **Save drafts** automatically or manually
5. **Publish** to your chosen platform

### **Managing Content**
- **View History**: Access all your articles and drafts
- **Edit Existing**: Load and modify previous articles
- **Track Progress**: See creation, update, and publish timestamps
- **Delete Articles**: Remove unwanted content

### **Publishing Workflow**
1. **Write** your article in the markdown editor
2. **Preview** how it will look
3. **Configure** tags and publish status
4. **Publish** to Medium (or other platforms)
5. **Track** your publishing metrics

## 🏗️ Architecture

### **Frontend**
- **HTML/CSS/JavaScript**: Clean, responsive interface
- **Markdown Editor**: Real-time preview with syntax highlighting
- **Drag & Drop**: Intuitive file upload system
- **History Panel**: Article management interface

### **Backend**
- **FastAPI**: Modern Python web framework
- **TinyDB**: Lightweight document storage
- **RESTful API**: Clean, extensible endpoints
- **Medium API**: Publishing integration

### **Data Model**
```json
{
  "title": "Article Title",
  "content": "Markdown content...",
  "tags": ["tag1", "tag2"],
  "publish_status": "draft|public|unlisted",
  "created_at": "2025-08-02T17:00:00",
  "updated_at": "2025-08-02T17:30:00",
  "published_at": "2025-08-02T18:00:00",
  "medium_url": "https://medium.com/...",
  "word_count": 1500
}
```

## 🔌 API Endpoints

### **Content Management**
- `POST /save-draft` - Save or update article draft
- `GET /history` - Get all articles and drafts
- `GET /article/{id}` - Get specific article
- `DELETE /history/{id}` - Delete article

### **Publishing**
- `POST /publish` - Publish article to Medium
- `GET /publish-status` - Check publishing status

## 🛣️ Roadmap

### **Phase 1: Core Platform (Current)**
- ✅ Markdown editor with live preview
- ✅ Draft management and version history
- ✅ Medium publishing integration
- ✅ Article history and management
- ✅ Modern, responsive UI

### **Phase 2: Multi-Platform Publishing**
- 🔄 **Dev.to Integration**: Publish to Dev.to community
- 🔄 **Hashnode Integration**: Publish to Hashnode
- 🔄 **WordPress Integration**: Self-hosted WordPress support
- 🔄 **Ghost Integration**: Ghost CMS publishing
- 🔄 **Custom API Support**: Generic webhook publishing

### **Phase 3: Advanced Features**
- 🔄 **SEO Tools**: Meta tags, structured data
- 🔄 **Image Management**: Upload and optimize images
- 🔄 **Collaboration**: Multi-user editing
- 🔄 **Analytics**: Publishing metrics and insights
- 🔄 **Scheduling**: Future publish dates

### **Phase 4: Enterprise Features**
- 🔄 **Team Management**: User roles and permissions
- 🔄 **Workflow Automation**: Approval processes
- 🔄 **Content Calendar**: Editorial planning
- 🔄 **API Rate Limiting**: Platform-specific limits
- 🔄 **Backup & Sync**: Cross-platform content sync

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### **Getting Started**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests if applicable
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### **Development Setup**
```bash
# Clone and setup
git clone https://github.com/yourusername/blogflow.git
cd blogflow
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Run development server
python main.py
```

### **Areas for Contribution**
- **New Publishing Platforms**: Add support for Dev.to, Hashnode, etc.
- **UI/UX Improvements**: Enhance the editor and interface
- **API Enhancements**: Add new endpoints and features
- **Documentation**: Improve docs and add tutorials
- **Testing**: Add unit and integration tests
- **Performance**: Optimize for speed and scalability

### **Code Style**
- Follow PEP 8 for Python code
- Use meaningful commit messages
- Add docstrings for new functions
- Include tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Medium API** for publishing integration
- **FastAPI** for the excellent web framework
- **TinyDB** for lightweight data storage
- **Marked.js** for markdown parsing
- **Font Awesome** for beautiful icons

## 📞 Support

- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join community discussions
- **Documentation**: Check the docs for detailed guides

---

**Made with ❤️ for the blogging community**