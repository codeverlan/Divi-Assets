import JSZip from 'jszip';
import Fuse from 'fuse.js';

export class AssetIndexer {
  constructor() {
    this.fuseOptions = {
      keys: [
        'name',
        'description',
        'tags',
        'category',
        'metadata.title',
        'metadata.description'
      ],
      threshold: 0.3,
      includeScore: true
    };
  }

  async processZipFile(file) {
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(file);
    const assets = [];

    // First, look for the main JSON file that contains all assets
    const jsonFiles = Object.keys(zipContent.files).filter(name => 
      name.endsWith('.json') && !zipContent.files[name].dir
    );

    if (jsonFiles.length > 0) {
      // Process the main JSON file (usually there's one master JSON)
      const mainJsonFile = jsonFiles[0];
      const jsonEntry = zipContent.files[mainJsonFile];
      
      try {
        const jsonContent = await jsonEntry.async('text');
        const jsonData = JSON.parse(jsonContent);
        
        // Parse the JSON structure to extract individual assets
        const extractedAssets = this.parseMainJsonFile(jsonData, file.name, mainJsonFile);
        assets.push(...extractedAssets);
        
      } catch (error) {
        console.warn(`Failed to parse main JSON file ${mainJsonFile}:`, error);
      }
    }

    // Process other files (images, additional JSONs, etc.)
    for (const [relativePath, zipEntry] of Object.entries(zipContent.files)) {
      if (zipEntry.dir) continue;
      
      const fileName = zipEntry.name.split('/').pop();
      const extension = fileName.split('.').pop().toLowerCase();
      
      // Skip the main JSON file we already processed
      if (jsonFiles.includes(relativePath)) continue;
      
      // Skip system files
      if (fileName.startsWith('.') || fileName.includes('__MACOSX')) {
        continue;
      }

      const asset = await this.processZipEntry(zipEntry, relativePath, file.name);
      if (asset) {
        assets.push(asset);
      }
    }

    return assets;
  }

  parseMainJsonFile(jsonData, zipName, fileName) {
    const assets = [];
    
    // Handle different JSON structures
    if (Array.isArray(jsonData)) {
      // If it's an array of assets
      jsonData.forEach((item, index) => {
        const asset = this.createAssetFromJsonItem(item, zipName, fileName, index);
        if (asset) assets.push(asset);
      });
    } else if (typeof jsonData === 'object') {
      // Handle object structures
      if (jsonData.content || jsonData.layouts || jsonData.sections) {
        // Divi export format
        const diviAssets = this.parseDiviExport(jsonData, zipName, fileName);
        assets.push(...diviAssets);
      } else if (jsonData.items || jsonData.assets) {
        // Collection format
        const items = jsonData.items || jsonData.assets;
        if (Array.isArray(items)) {
          items.forEach((item, index) => {
            const asset = this.createAssetFromJsonItem(item, zipName, fileName, index);
            if (asset) assets.push(asset);
          });
        }
      } else {
        // Single asset format
        const asset = this.createAssetFromJsonItem(jsonData, zipName, fileName, 0);
        if (asset) assets.push(asset);
      }
    }

    return assets;
  }

  parseDiviExport(jsonData, zipName, fileName) {
    const assets = [];
    
    if (jsonData.content) {
      // Handle Divi layout export
      const contentStr = JSON.stringify(jsonData.content);
      const sections = this.extractSectionsFromContent(contentStr);
      
      sections.forEach((section, index) => {
        const asset = {
          id: this.generateId(),
          name: section.name || `Section ${index + 1}`,
          originalName: `${fileName}_section_${index}`,
          path: fileName,
          size: JSON.stringify(section.content).length,
          type: 'code',
          category: 'section',
          tags: section.tags || [],
          uploadDate: new Date().toISOString(),
          sourceZip: zipName,
          metadata: section.metadata || {},
          extension: 'json',
          content: JSON.stringify(section.content, null, 2),
          jsonContent: section.content,
          copyableContent: this.prepareCopyableContent(section.content)
        };
        
        assets.push(asset);
      });
      
      // Also create a full layout asset
      const layoutAsset = {
        id: this.generateId(),
        name: jsonData.title || 'Full Layout',
        originalName: fileName,
        path: fileName,
        size: JSON.stringify(jsonData).length,
        type: 'code',
        category: 'layout',
        tags: this.extractDiviTags(jsonData, fileName),
        uploadDate: new Date().toISOString(),
        sourceZip: zipName,
        metadata: this.extractDiviMetadata(jsonData),
        extension: 'json',
        content: JSON.stringify(jsonData, null, 2),
        jsonContent: jsonData,
        copyableContent: this.prepareCopyableContent(jsonData)
      };
      
      assets.push(layoutAsset);
    }
    
    return assets;
  }

  extractSectionsFromContent(contentStr) {
    const sections = [];
    
    try {
      // Look for section patterns in the content
      const sectionRegex = /"type":"section"[^}]*"content":\s*(\[[^\]]*\])/g;
      let match;
      let sectionIndex = 0;
      
      while ((match = sectionRegex.exec(contentStr)) !== null) {
        try {
          const sectionContent = JSON.parse(match[1]);
          sections.push({
            name: `Section ${sectionIndex + 1}`,
            content: sectionContent,
            tags: this.extractTagsFromSection(sectionContent),
            metadata: this.extractMetadataFromSection(sectionContent)
          });
          sectionIndex++;
        } catch (e) {
          console.warn('Failed to parse section content:', e);
        }
      }
      
      // If no sections found, try to parse as modules
      if (sections.length === 0) {
        const moduleRegex = /"type":"(?:et_pb_|)(\w+)"[^}]*"content":\s*(\{[^}]*\})/g;
        let moduleMatch;
        let moduleIndex = 0;
        
        while ((moduleMatch = moduleRegex.exec(contentStr)) !== null) {
          try {
            const moduleContent = JSON.parse(moduleMatch[2]);
            sections.push({
              name: `${moduleMatch[1]} Module ${moduleIndex + 1}`,
              content: moduleContent,
              tags: [moduleMatch[1], 'module'],
              metadata: { moduleType: moduleMatch[1] }
            });
            moduleIndex++;
          } catch (e) {
            console.warn('Failed to parse module content:', e);
          }
        }
      }
    } catch (error) {
      console.warn('Error extracting sections:', error);
    }
    
    return sections;
  }

  extractTagsFromSection(sectionContent) {
    const tags = [];
    const contentStr = JSON.stringify(sectionContent).toLowerCase();
    
    // Add module-specific tags
    if (contentStr.includes('gallery')) tags.push('gallery');
    if (contentStr.includes('slider')) tags.push('slider');
    if (contentStr.includes('testimonial')) tags.push('testimonials');
    if (contentStr.includes('pricing')) tags.push('pricing');
    if (contentStr.includes('contact')) tags.push('contact');
    if (contentStr.includes('team')) tags.push('team');
    if (contentStr.includes('portfolio')) tags.push('portfolio');
    if (contentStr.includes('blog')) tags.push('blog');
    if (contentStr.includes('woocommerce')) tags.push('woocommerce');
    
    return tags;
  }

  extractMetadataFromSection(sectionContent) {
    const metadata = {};
    const contentStr = JSON.stringify(sectionContent);
    
    // Extract colors
    const colors = this.extractColors({ content: sectionContent });
    if (colors.length > 0) metadata.colors = colors;
    
    // Extract fonts
    const fonts = this.extractFonts({ content: sectionContent });
    if (fonts.length > 0) metadata.fonts = fonts;
    
    // Count modules
    const moduleMatches = contentStr.match(/et_pb_\w+/g);
    if (moduleMatches) {
      metadata.moduleCount = moduleMatches.length;
      metadata.uniqueModules = [...new Set(moduleMatches)];
    }
    
    return metadata;
  }

  createAssetFromJsonItem(item, zipName, fileName, index) {
    if (!item || typeof item !== 'object') return null;
    
    const asset = {
      id: this.generateId(),
      name: item.name || item.title || `Asset ${index + 1}`,
      originalName: `${fileName}_item_${index}`,
      path: fileName,
      size: JSON.stringify(item).length,
      type: 'code',
      category: this.categorizeJsonItem(item),
      tags: this.extractTagsFromJsonItem(item),
      uploadDate: new Date().toISOString(),
      sourceZip: zipName,
      metadata: this.extractMetadataFromJsonItem(item),
      extension: 'json',
      content: JSON.stringify(item, null, 2),
      jsonContent: item,
      copyableContent: this.prepareCopyableContent(item)
    };
    
    return asset;
  }

  categorizeJsonItem(item) {
    const itemStr = JSON.stringify(item).toLowerCase();
    
    if (itemStr.includes('et_pb_section')) return 'section';
    if (itemStr.includes('et_pb_row')) return 'row';
    if (itemStr.includes('et_pb_')) return 'module';
    if (itemStr.includes('layout')) return 'layout';
    if (itemStr.includes('template')) return 'template';
    if (itemStr.includes('page')) return 'page';
    
    return 'divi-component';
  }

  extractTagsFromJsonItem(item) {
    const tags = [];
    const itemStr = JSON.stringify(item).toLowerCase();
    
    // Basic tags from content
    if (itemStr.includes('responsive')) tags.push('responsive');
    if (itemStr.includes('mobile')) tags.push('mobile');
    if (itemStr.includes('animation')) tags.push('animated');
    if (itemStr.includes('gallery')) tags.push('gallery');
    if (itemStr.includes('slider')) tags.push('slider');
    if (itemStr.includes('contact')) tags.push('contact');
    if (itemStr.includes('portfolio')) tags.push('portfolio');
    if (itemStr.includes('testimonial')) tags.push('testimonials');
    if (itemStr.includes('pricing')) tags.push('pricing');
    if (itemStr.includes('team')) tags.push('team');
    if (itemStr.includes('blog')) tags.push('blog');
    if (itemStr.includes('woocommerce')) tags.push('woocommerce');
    
    return tags;
  }

  extractMetadataFromJsonItem(item) {
    const metadata = {};
    
    // Extract colors
    const colors = this.extractColors(item);
    if (colors.length > 0) metadata.colors = colors;
    
    // Extract fonts
    const fonts = this.extractFonts(item);
    if (fonts.length > 0) metadata.fonts = fonts;
    
    // Extract version info
    if (item.version) metadata.version = item.version;
    
    // Extract module information
    const itemStr = JSON.stringify(item);
    const moduleMatches = itemStr.match(/et_pb_\w+/g);
    if (moduleMatches) {
      metadata.moduleCount = moduleMatches.length;
      metadata.uniqueModules = [...new Set(moduleMatches)];
    }
    
    return metadata;
  }

  async processZipEntry(zipEntry, relativePath, zipName) {
    const fileName = zipEntry.name.split('/').pop();
    const extension = fileName.split('.').pop().toLowerCase();

    // Skip system files
    if (fileName.startsWith('.') || fileName.includes('__MACOSX')) {
      return null;
    }

    const asset = {
      id: this.generateId(),
      name: fileName,
      originalName: fileName,
      path: relativePath,
      size: zipEntry._data?.uncompressedSize || 0,
      type: this.getAssetType(extension),
      category: null, // Will be determined dynamically
      tags: [],
      uploadDate: new Date().toISOString(),
      sourceZip: zipName,
      metadata: {},
      extension: extension,
      content: null,
      copyableContent: null
    };

    // Process JSON files
    if (extension === 'json') {
      try {
        const content = await zipEntry.async('text');
        const jsonData = JSON.parse(content);
        asset.jsonContent = jsonData;
        asset.content = content;
        asset.copyableContent = this.prepareCopyableContent(jsonData);
        asset.metadata = this.extractDiviMetadata(jsonData);
        asset.category = this.categorizeDiviAsset(jsonData, fileName);
        asset.tags = this.extractDiviTags(jsonData, fileName);
      } catch (error) {
        console.warn(`Failed to parse JSON file ${fileName}:`, error);
        asset.category = 'unknown-json';
        asset.tags = this.extractBasicTags(fileName);
      }
    }
    // Process image files
    else if (this.isImageFile(extension)) {
      try {
        const blob = await zipEntry.async('blob');
        asset.preview = URL.createObjectURL(blob);
        asset.blob = blob;
        asset.category = this.categorizeImageAsset(fileName);
        asset.tags = this.extractImageTags(fileName);
      } catch (error) {
        console.warn(`Failed to process image ${fileName}:`, error);
        asset.category = 'image';
        asset.tags = this.extractBasicTags(fileName);
      }
    }
    // Process other file types
    else {
      try {
        const content = await zipEntry.async('text');
        asset.content = content;
        asset.category = this.categorizeGenericAsset(fileName, extension, content);
        asset.tags = this.extractGenericTags(fileName, extension, content);
      } catch (error) {
        // Binary file or unreadable
        asset.category = this.categorizeByExtension(extension);
        asset.tags = this.extractBasicTags(fileName);
      }
    }

    return asset;
  }

  prepareCopyableContent(jsonData) {
    // Prepare different formats for easy copying
    const copyable = {
      raw: JSON.stringify(jsonData, null, 2),
      minified: JSON.stringify(jsonData),
      diviImport: this.prepareDiviImportFormat(jsonData)
    };

    return copyable;
  }

  prepareDiviImportFormat(jsonData) {
    // Format specifically for Divi import
    if (jsonData.content) {
      return {
        version: jsonData.version || '4.0',
        content: jsonData.content,
        settings: jsonData.settings || {}
      };
    }
    return jsonData;
  }

  extractDiviMetadata(jsonData) {
    const metadata = {};

    // Extract version information
    if (jsonData.version) metadata.version = jsonData.version;

    // Analyze content structure
    if (jsonData.content) {
      metadata.hasContent = true;
      metadata.contentLength = JSON.stringify(jsonData.content).length;

      // Extract modules and their details
      const moduleInfo = this.analyzeModules(jsonData.content);
      metadata.modules = moduleInfo.modules;
      metadata.moduleCount = moduleInfo.count;
      metadata.uniqueModules = moduleInfo.unique;
    }

    // Extract design elements
    metadata.colors = this.extractColors(jsonData);
    metadata.fonts = this.extractFonts(jsonData);
    metadata.customCSS = this.extractCustomCSS(jsonData);
    metadata.animations = this.extractAnimations(jsonData);

    // Extract settings and configuration
    if (jsonData.settings) {
      metadata.settings = this.analyzeDiviSettings(jsonData.settings);
    }

    return metadata;
  }

  analyzeModules(content) {
    const modules = [];
    const moduleCount = {};
    const contentStr = JSON.stringify(content);

    // Enhanced module detection patterns
    const modulePatterns = [
      /et_pb_(\w+)/g,
      /"module_type":\s*"([^"]+)"/g,
      /"type":\s*"([^"]+)"/g
    ];

    modulePatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(contentStr)) !== null) {
        const moduleName = match[1];
        if (moduleName && !moduleName.includes('_')) {
          modules.push(moduleName);
          moduleCount[moduleName] = (moduleCount[moduleName] || 0) + 1;
        }
      }
    });

    return {
      modules: modules,
      count: modules.length,
      unique: Object.keys(moduleCount),
      distribution: moduleCount
    };
  }

  extractCustomCSS(jsonData) {
    const css = [];
    const contentStr = JSON.stringify(jsonData);

    // Look for custom CSS patterns
    const cssPatterns = [
      /"custom_css[^"]*":\s*"([^"]+)"/g,
      /"before":\s*"([^"]*<style[^>]*>.*?<\/style>[^"]*)"/g
    ];

    cssPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(contentStr)) !== null) {
        if (match[1] && match[1].trim()) {
          css.push(match[1]);
        }
      }
    });

    return css;
  }

  extractAnimations(jsonData) {
    const animations = new Set();
    const contentStr = JSON.stringify(jsonData);

    // Look for animation patterns
    const animationPatterns = [
      /"animation[^"]*":\s*"([^"]+)"/g,
      /"entrance_animation":\s*"([^"]+)"/g
    ];

    animationPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(contentStr)) !== null) {
        if (match[1] && match[1] !== 'off' && match[1] !== 'none') {
          animations.add(match[1]);
        }
      }
    });

    return Array.from(animations);
  }

  categorizeDiviAsset(jsonData, fileName) {
    const name = fileName.toLowerCase();
    const contentStr = JSON.stringify(jsonData).toLowerCase();

    // Analyze content to determine category
    if (contentStr.includes('et_pb_section')) {
      if (contentStr.includes('et_pb_row') && contentStr.includes('et_pb_column')) {
        return 'layout';
      }
      return 'section';
    }

    if (contentStr.includes('et_pb_row')) {
      return 'row';
    }

    // Check for specific module types
    const moduleMatches = contentStr.match(/et_pb_(\w+)/g);
    if (moduleMatches) {
      const uniqueModules = [...new Set(moduleMatches)];
      if (uniqueModules.length === 1) {
        return `module-${uniqueModules[0].replace('et_pb_', '')}`;
      } else if (uniqueModules.length > 1) {
        return 'multi-module';
      }
    }

    // Fallback to filename analysis
    if (name.includes('layout')) return 'layout';
    if (name.includes('section')) return 'section';
    if (name.includes('module')) return 'module';
    if (name.includes('header')) return 'header';
    if (name.includes('footer')) return 'footer';
    if (name.includes('page')) return 'page';
    if (name.includes('template')) return 'template';

    return 'divi-component';
  }

  categorizeImageAsset(fileName) {
    const name = fileName.toLowerCase();

    // Specific image categories
    if (name.includes('hero') || name.includes('banner')) return 'hero-image';
    if (name.includes('background') || name.includes('bg')) return 'background';
    if (name.includes('header')) return 'header-image';
    if (name.includes('footer')) return 'footer-image';
    if (name.includes('logo')) return 'logo';
    if (name.includes('icon')) return 'icon';
    if (name.includes('gallery')) return 'gallery-image';
    if (name.includes('portfolio')) return 'portfolio-image';
    if (name.includes('testimonial')) return 'testimonial-image';
    if (name.includes('team') || name.includes('staff')) return 'team-image';
    if (name.includes('product')) return 'product-image';

    return 'image';
  }

  categorizeGenericAsset(fileName, extension, content = '') {
    const name = fileName.toLowerCase();
    const contentLower = content.toLowerCase();

    // CSS files
    if (extension === 'css') {
      if (contentLower.includes('@media')) return 'responsive-css';
      if (contentLower.includes('animation') || contentLower.includes('keyframes')) return 'animation-css';
      return 'stylesheet';
    }

    // JavaScript files
    if (extension === 'js') {
      if (contentLower.includes('jquery')) return 'jquery-script';
      if (contentLower.includes('animation')) return 'animation-script';
      return 'script';
    }

    // PHP files
    if (extension === 'php') {
      if (contentLower.includes('function')) return 'php-function';
      if (contentLower.includes('shortcode')) return 'shortcode';
      return 'php-code';
    }

    // HTML files
    if (extension === 'html' || extension === 'htm') {
      return 'html-template';
    }

    return this.categorizeByExtension(extension);
  }

  categorizeByExtension(extension) {
    const extensionMap = {
      'pdf': 'document',
      'doc': 'document',
      'docx': 'document',
      'txt': 'text-file',
      'md': 'markdown',
      'xml': 'xml-data',
      'svg': 'vector-graphic',
      'psd': 'photoshop-file',
      'ai': 'illustrator-file',
      'sketch': 'sketch-file',
      'fig': 'figma-file',
      'zip': 'archive',
      'rar': 'archive',
      'woff': 'font-file',
      'woff2': 'font-file',
      'ttf': 'font-file',
      'otf': 'font-file'
    };

    return extensionMap[extension] || 'unknown';
  }

  extractDiviTags(jsonData, fileName) {
    const tags = new Set();
    const contentStr = JSON.stringify(jsonData).toLowerCase();
    const name = fileName.toLowerCase();

    // Add basic filename tags
    this.extractBasicTags(fileName).forEach(tag => tags.add(tag));

    // Divi-specific tags based on content
    if (contentStr.includes('woocommerce')) tags.add('woocommerce');
    if (contentStr.includes('contact')) tags.add('contact-form');
    if (contentStr.includes('gallery')) tags.add('gallery');
    if (contentStr.includes('slider')) tags.add('slider');
    if (contentStr.includes('testimonial')) tags.add('testimonials');
    if (contentStr.includes('pricing')) tags.add('pricing');
    if (contentStr.includes('team')) tags.add('team');
    if (contentStr.includes('portfolio')) tags.add('portfolio');
    if (contentStr.includes('blog')) tags.add('blog');
    if (contentStr.includes('cta') || contentStr.includes('call_to_action')) tags.add('call-to-action');
    if (contentStr.includes('video')) tags.add('video');
    if (contentStr.includes('audio')) tags.add('audio');
    if (contentStr.includes('map')) tags.add('map');
    if (contentStr.includes('social')) tags.add('social');
    if (contentStr.includes('newsletter')) tags.add('newsletter');
    if (contentStr.includes('accordion')) tags.add('accordion');
    if (contentStr.includes('tabs')) tags.add('tabs');
    if (contentStr.includes('toggle')) tags.add('toggle');
    if (contentStr.includes('countdown')) tags.add('countdown');
    if (contentStr.includes('progress')) tags.add('progress-bar');

    // Responsive tags
    if (contentStr.includes('tablet') || contentStr.includes('mobile')) tags.add('responsive');

    // Animation tags
    if (contentStr.includes('animation')) tags.add('animated');

    return Array.from(tags);
  }

  extractImageTags(fileName) {
    const tags = new Set();
    const name = fileName.toLowerCase();

    // Add basic tags
    this.extractBasicTags(fileName).forEach(tag => tags.add(tag));

    // Image-specific tags
    if (name.includes('retina') || name.includes('2x')) tags.add('retina');
    if (name.includes('thumb') || name.includes('thumbnail')) tags.add('thumbnail');
    if (name.includes('placeholder')) tags.add('placeholder');

    return Array.from(tags);
  }

  extractGenericTags(fileName, extension, content = '') {
    const tags = new Set();

    // Add basic tags
    this.extractBasicTags(fileName).forEach(tag => tags.add(tag));

    // Content-based tags
    if (content) {
      const contentLower = content.toLowerCase();
      if (contentLower.includes('responsive')) tags.add('responsive');
      if (contentLower.includes('mobile')) tags.add('mobile');
      if (contentLower.includes('tablet')) tags.add('tablet');
      if (contentLower.includes('animation')) tags.add('animated');
      if (contentLower.includes('jquery')) tags.add('jquery');
      if (contentLower.includes('bootstrap')) tags.add('bootstrap');
    }

    return Array.from(tags);
  }

  extractBasicTags(fileName) {
    const tags = [];
    const name = fileName.toLowerCase();

    // Common patterns
    const tagPatterns = {
      'responsive': /responsive|mobile|tablet/,
      'ecommerce': /shop|store|ecommerce|woocommerce|cart|checkout/,
      'business': /business|corporate|company|office/,
      'portfolio': /portfolio|gallery|showcase|work/,
      'blog': /blog|article|post|news/,
      'landing': /landing|lp|lead/,
      'header': /header|nav|menu|navigation/,
      'footer': /footer/,
      'hero': /hero|banner|jumbotron/,
      'contact': /contact|form|touch/,
      'about': /about|team|staff|bio/,
      'services': /service|feature|offer/,
      'pricing': /pricing|price|plan|package/,
      'testimonial': /testimonial|review|feedback/,
      'call-to-action': /cta|action|button/,
      'modern': /modern|contemporary|clean/,
      'creative': /creative|artistic|design/,
      'minimal': /minimal|simple|clean/,
      'dark': /dark|night|black/,
      'light': /light|bright|white/
    };

    Object.entries(tagPatterns).forEach(([tag, pattern]) => {
      if (pattern.test(name)) {
        tags.push(tag);
      }
    });

    return tags;
  }

  extractColors(jsonData) {
    const colors = new Set();
    const contentStr = JSON.stringify(jsonData);

    // Extract hex colors
    const hexPattern = /#([a-fA-F0-9]{6}|[a-fA-F0-9]{3})/g;
    let match;
    while ((match = hexPattern.exec(contentStr)) !== null) {
      colors.add(match[0]);
    }

    // Extract rgba colors
    const rgbaPattern = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)/g;
    while ((match = rgbaPattern.exec(contentStr)) !== null) {
      colors.add(match[0]);
    }

    return Array.from(colors);
  }

  extractFonts(jsonData) {
    const fonts = new Set();
    const contentStr = JSON.stringify(jsonData);

    // Extract font family references
    const fontPattern = /"font[_-]?family":\s*"([^"]+)"/gi;
    let match;
    while ((match = fontPattern.exec(contentStr)) !== null) {
      fonts.add(match[1]);
    }

    return Array.from(fonts);
  }

  analyzeDiviSettings(settings) {
    const analysis = {};
    if (settings.responsive) analysis.responsive = true;
    if (settings.custom_css) analysis.hasCustomCSS = true;
    if (settings.animations) analysis.hasAnimations = true;
    return analysis;
  }

  getAssetType(extension) {
    const typeMap = {
      // Images
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'svg': 'image',
      'webp': 'image',
      'bmp': 'image',
      'tiff': 'image',
      // Documents
      'pdf': 'document',
      'doc': 'document',
      'docx': 'document',
      'txt': 'document',
      'md': 'document',
      'rtf': 'document',
      // Code
      'json': 'code',
      'css': 'code',
      'js': 'code',
      'html': 'code',
      'php': 'code',
      'xml': 'code',
      'scss': 'code',
      'sass': 'code',
      // Fonts
      'woff': 'font',
      'woff2': 'font',
      'ttf': 'font',
      'otf': 'font',
      // Archives
      'zip': 'archive',
      'rar': 'archive',
      '7z': 'archive',
      // Design
      'psd': 'design',
      'ai': 'design',
      'sketch': 'design',
      'fig': 'design'
    };

    return typeMap[extension.toLowerCase()] || 'other';
  }

  isImageFile(extension) {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'tiff'];
    return imageExtensions.includes(extension.toLowerCase());
  }

  searchAssets(assets, searchTerm, category = 'all', tags = []) {
    let filteredAssets = assets;

    // Filter by category
    if (category !== 'all') {
      filteredAssets = filteredAssets.filter(asset => asset.category === category);
    }

    // Filter by tags
    if (tags.length > 0) {
      filteredAssets = filteredAssets.filter(asset =>
        tags.every(tag => asset.tags.includes(tag))
      );
    }

    // Search by term
    if (searchTerm && searchTerm.trim()) {
      const fuse = new Fuse(filteredAssets, this.fuseOptions);
      const results = fuse.search(searchTerm);
      return results.map(result => result.item);
    }

    return filteredAssets;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}