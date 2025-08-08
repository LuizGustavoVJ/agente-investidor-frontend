<template>
  <div class="collaborative-features">
    <div class="features-header">
      <h2 class="header-title">Recursos Colaborativos</h2>
      <p class="header-subtitle">Conecte-se com outros investidores, compartilhe estratégias e aprenda em comunidade</p>
    </div>

    <!-- Navegação por Abas -->
    <div class="features-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        @click="activeTab = tab.id"
        class="tab-button"
        :class="{ active: activeTab === tab.id }"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        <span class="tab-label">{{ tab.label }}</span>
        <span v-if="tab.badge" class="tab-badge">{{ tab.badge }}</span>
      </button>
    </div>

    <!-- Social Trading -->
    <div v-if="activeTab === 'social-trading'" class="tab-content">
      <div class="social-trading-section">
        <div class="section-header">
          <h3 class="section-title">Social Trading</h3>
          <p class="section-subtitle">Siga investidores experientes e copie suas estratégias automaticamente</p>
        </div>

        <!-- Top Traders -->
        <div class="top-traders">
          <h4 class="subsection-title">Top Traders da Semana</h4>
          <div class="traders-grid">
            <div 
              v-for="trader in topTraders" 
              :key="trader.id"
              class="trader-card"
            >
              <div class="trader-header">
                <div class="trader-avatar">
                  <img :src="trader.avatar" :alt="trader.name" class="avatar-image" />
                  <div v-if="trader.verified" class="verified-badge">✓</div>
                </div>
                <div class="trader-info">
                  <h5 class="trader-name">{{ trader.name }}</h5>
                  <p class="trader-title">{{ trader.title }}</p>
                  <div class="trader-stats">
                    <span class="stat-item">
                      <span class="stat-label">Seguidores:</span>
                      <span class="stat-value">{{ formatNumber(trader.followers) }}</span>
                    </span>
                    <span class="stat-item">
                      <span class="stat-label">Experiência:</span>
                      <span class="stat-value">{{ trader.experience }} anos</span>
                    </span>
                  </div>
                </div>
                <div class="trader-actions">
                  <button 
                    @click="followTrader(trader)"
                    :class="{ following: trader.isFollowing }"
                    class="follow-btn"
                  >
                    {{ trader.isFollowing ? 'Seguindo' : 'Seguir' }}
                  </button>
                </div>
              </div>

              <div class="trader-performance">
                <div class="performance-metric">
                  <span class="metric-label">Retorno (30d)</span>
                  <span class="metric-value" :class="{ positive: trader.return30d > 0, negative: trader.return30d < 0 }">
                    {{ formatPercentage(trader.return30d) }}
                  </span>
                </div>
                <div class="performance-metric">
                  <span class="metric-label">Sharpe Ratio</span>
                  <span class="metric-value">{{ trader.sharpeRatio.toFixed(2) }}</span>
                </div>
                <div class="performance-metric">
                  <span class="metric-label">Max Drawdown</span>
                  <span class="metric-value negative">{{ formatPercentage(trader.maxDrawdown) }}</span>
                </div>
                <div class="performance-metric">
                  <span class="metric-label">Win Rate</span>
                  <span class="metric-value">{{ formatPercentage(trader.winRate) }}</span>
                </div>
              </div>

              <div class="trader-strategy">
                <h6 class="strategy-title">Estratégia Principal</h6>
                <p class="strategy-description">{{ trader.strategy }}</p>
                <div class="strategy-tags">
                  <span 
                    v-for="tag in trader.tags" 
                    :key="tag"
                    class="strategy-tag"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <div class="trader-copy">
                <button 
                  @click="copyTrader(trader)"
                  :disabled="trader.isFollowing && trader.isCopying"
                  class="copy-btn"
                >
                  {{ trader.isCopying ? 'Copiando' : 'Copiar Estratégia' }}
                </button>
                <div v-if="trader.isCopying" class="copy-settings">
                  <div class="copy-setting">
                    <label class="setting-label">Valor a Copiar:</label>
                    <input 
                      v-model="trader.copyAmount"
                      type="number"
                      min="100"
                      step="100"
                      class="setting-input"
                    />
                  </div>
                  <div class="copy-setting">
                    <label class="setting-label">
                      <input 
                        v-model="trader.autoRebalance"
                        type="checkbox"
                        class="setting-checkbox"
                      />
                      <span class="setting-text">Rebalanceamento Automático</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Meu Portfolio Social -->
        <div class="social-portfolio">
          <h4 class="subsection-title">Meu Portfolio Social</h4>
          <div class="portfolio-summary">
            <div class="summary-card">
              <div class="summary-metric">
                <span class="metric-label">Traders Seguidos</span>
                <span class="metric-value">{{ socialPortfolio.followedTraders }}</span>
              </div>
              <div class="summary-metric">
                <span class="metric-label">Estratégias Copiadas</span>
                <span class="metric-value">{{ socialPortfolio.copiedStrategies }}</span>
              </div>
              <div class="summary-metric">
                <span class="metric-label">Valor Total Copiado</span>
                <span class="metric-value">{{ formatCurrency(socialPortfolio.totalCopied) }}</span>
              </div>
              <div class="summary-metric">
                <span class="metric-label">Performance Social</span>
                <span class="metric-value" :class="{ positive: socialPortfolio.performance > 0, negative: socialPortfolio.performance < 0 }">
                  {{ formatPercentage(socialPortfolio.performance) }}
                </span>
              </div>
            </div>
          </div>

          <div class="copied-strategies">
            <h5 class="strategies-title">Estratégias em Cópia</h5>
            <div class="strategies-list">
              <div 
                v-for="strategy in copiedStrategies" 
                :key="strategy.id"
                class="strategy-item"
              >
                <div class="strategy-info">
                  <div class="strategy-trader">
                    <img :src="strategy.traderAvatar" :alt="strategy.traderName" class="trader-mini-avatar" />
                    <span class="trader-mini-name">{{ strategy.traderName }}</span>
                  </div>
                  <div class="strategy-details">
                    <span class="strategy-name">{{ strategy.name }}</span>
                    <span class="strategy-amount">{{ formatCurrency(strategy.amount) }}</span>
                  </div>
                </div>
                <div class="strategy-performance">
                  <span class="performance-value" :class="{ positive: strategy.performance > 0, negative: strategy.performance < 0 }">
                    {{ formatPercentage(strategy.performance) }}
                  </span>
                </div>
                <div class="strategy-actions">
                  <button @click="adjustCopy(strategy)" class="adjust-btn">⚙️</button>
                  <button @click="stopCopy(strategy)" class="stop-btn">⏹️</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Community Forum -->
    <div v-if="activeTab === 'forum'" class="tab-content">
      <div class="forum-section">
        <div class="section-header">
          <h3 class="section-title">Fórum da Comunidade</h3>
          <p class="section-subtitle">Discuta estratégias, tire dúvidas e compartilhe conhecimento</p>
          <button @click="showNewTopicModal = true" class="new-topic-btn">
            + Novo Tópico
          </button>
        </div>

        <!-- Categorias -->
        <div class="forum-categories">
          <button 
            v-for="category in forumCategories" 
            :key="category.id"
            @click="selectedCategory = category.id"
            class="category-btn"
            :class="{ active: selectedCategory === category.id }"
          >
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
            <span class="category-count">{{ category.topicCount }}</span>
          </button>
        </div>

        <!-- Lista de Tópicos -->
        <div class="topics-list">
          <div 
            v-for="topic in filteredTopics" 
            :key="topic.id"
            class="topic-item"
            @click="openTopic(topic)"
          >
            <div class="topic-header">
              <div class="topic-info">
                <h4 class="topic-title">{{ topic.title }}</h4>
                <div class="topic-meta">
                  <span class="topic-author">por {{ topic.author }}</span>
                  <span class="topic-date">{{ formatDate(topic.createdAt) }}</span>
                  <span class="topic-category">{{ getCategoryName(topic.category) }}</span>
                </div>
              </div>
              <div class="topic-stats">
                <div class="stat">
                  <span class="stat-number">{{ topic.replies }}</span>
                  <span class="stat-label">respostas</span>
                </div>
                <div class="stat">
                  <span class="stat-number">{{ topic.views }}</span>
                  <span class="stat-label">visualizações</span>
                </div>
                <div class="stat">
                  <span class="stat-number">{{ topic.likes }}</span>
                  <span class="stat-label">curtidas</span>
                </div>
              </div>
            </div>
            <div class="topic-preview">
              <p class="topic-excerpt">{{ topic.excerpt }}</p>
              <div class="topic-tags">
                <span 
                  v-for="tag in topic.tags" 
                  :key="tag"
                  class="topic-tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            <div class="topic-last-activity">
              <div class="last-reply">
                <img :src="topic.lastReply.avatar" :alt="topic.lastReply.author" class="reply-avatar" />
                <div class="reply-info">
                  <span class="reply-author">{{ topic.lastReply.author }}</span>
                  <span class="reply-date">{{ formatDate(topic.lastReply.date) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Knowledge Sharing -->
    <div v-if="activeTab === 'knowledge'" class="tab-content">
      <div class="knowledge-section">
        <div class="section-header">
          <h3 class="section-title">Compartilhamento de Conhecimento</h3>
          <p class="section-subtitle">Aprenda com análises, tutoriais e insights da comunidade</p>
          <button @click="showNewArticleModal = true" class="new-article-btn">
            + Compartilhar Conhecimento
          </button>
        </div>

        <!-- Filtros -->
        <div class="knowledge-filters">
          <select v-model="knowledgeFilter" class="filter-select">
            <option value="all">Todos os Tipos</option>
            <option value="analysis">Análises</option>
            <option value="tutorial">Tutoriais</option>
            <option value="insight">Insights</option>
            <option value="strategy">Estratégias</option>
          </select>
          <select v-model="knowledgeSort" class="filter-select">
            <option value="recent">Mais Recentes</option>
            <option value="popular">Mais Populares</option>
            <option value="trending">Em Alta</option>
            <option value="rating">Melhor Avaliados</option>
          </select>
        </div>

        <!-- Grid de Conhecimento -->
        <div class="knowledge-grid">
          <div 
            v-for="item in filteredKnowledge" 
            :key="item.id"
            class="knowledge-card"
          >
            <div class="knowledge-header">
              <div class="knowledge-type" :class="item.type">{{ getTypeLabel(item.type) }}</div>
              <div class="knowledge-rating">
                <span class="rating-stars">{{ '★'.repeat(Math.floor(item.rating)) }}{{ '☆'.repeat(5 - Math.floor(item.rating)) }}</span>
                <span class="rating-value">{{ item.rating.toFixed(1) }}</span>
              </div>
            </div>
            
            <div class="knowledge-content">
              <h4 class="knowledge-title">{{ item.title }}</h4>
              <p class="knowledge-description">{{ item.description }}</p>
              
              <div class="knowledge-author">
                <img :src="item.author.avatar" :alt="item.author.name" class="author-avatar" />
                <div class="author-info">
                  <span class="author-name">{{ item.author.name }}</span>
                  <span class="author-title">{{ item.author.title }}</span>
                </div>
                <div v-if="item.author.verified" class="author-verified">✓</div>
              </div>

              <div class="knowledge-stats">
                <div class="stat-item">
                  <span class="stat-icon">👁️</span>
                  <span class="stat-value">{{ formatNumber(item.views) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">👍</span>
                  <span class="stat-value">{{ formatNumber(item.likes) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">💬</span>
                  <span class="stat-value">{{ formatNumber(item.comments) }}</span>
                </div>
                <div class="stat-item">
                  <span class="stat-icon">📅</span>
                  <span class="stat-value">{{ formatDate(item.publishedAt) }}</span>
                </div>
              </div>

              <div class="knowledge-tags">
                <span 
                  v-for="tag in item.tags" 
                  :key="tag"
                  class="knowledge-tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>

            <div class="knowledge-actions">
              <button @click="readKnowledge(item)" class="read-btn">Ler Completo</button>
              <button @click="likeKnowledge(item)" class="like-btn" :class="{ liked: item.isLiked }">
                👍 {{ item.isLiked ? 'Curtido' : 'Curtir' }}
              </button>
              <button @click="saveKnowledge(item)" class="save-btn" :class="{ saved: item.isSaved }">
                🔖 {{ item.isSaved ? 'Salvo' : 'Salvar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Groups -->
    <div v-if="activeTab === 'groups'" class="tab-content">
      <div class="groups-section">
        <div class="section-header">
          <h3 class="section-title">Grupos de Investimento</h3>
          <p class="section-subtitle">Participe de grupos temáticos e discuta estratégias específicas</p>
          <button @click="showNewGroupModal = true" class="new-group-btn">
            + Criar Grupo
          </button>
        </div>

        <!-- Meus Grupos -->
        <div class="my-groups">
          <h4 class="subsection-title">Meus Grupos</h4>
          <div class="groups-grid">
            <div 
              v-for="group in myGroups" 
              :key="group.id"
              class="group-card my-group"
            >
              <div class="group-header">
                <div class="group-avatar">
                  <img :src="group.avatar" :alt="group.name" class="group-image" />
                  <div v-if="group.isPrivate" class="private-badge">🔒</div>
                </div>
                <div class="group-info">
                  <h5 class="group-name">{{ group.name }}</h5>
                  <p class="group-description">{{ group.description }}</p>
                </div>
                <div class="group-role">{{ group.myRole }}</div>
              </div>

              <div class="group-stats">
                <div class="stat">
                  <span class="stat-number">{{ formatNumber(group.members) }}</span>
                  <span class="stat-label">membros</span>
                </div>
                <div class="stat">
                  <span class="stat-number">{{ group.posts }</span>
                  <span class="stat-label">posts</span>
                </div>
                <div class="stat">
                  <span class="stat-number">{{ group.activity }}</span>
                  <span class="stat-label">atividade</span>
                </div>
              </div>

              <div class="group-recent">
                <h6 class="recent-title">Atividade Recente</h6>
                <div class="recent-posts">
                  <div 
                    v-for="post in group.recentPosts" 
                    :key="post.id"
                    class="recent-post"
                  >
                    <span class="post-author">{{ post.author }}</span>
                    <span class="post-title">{{ post.title }}</span>
                    <span class="post-time">{{ formatTime(post.time) }}</span>
                  </div>
                </div>
              </div>

              <div class="group-actions">
                <button @click="enterGroup(group)" class="enter-btn">Entrar</button>
                <button @click="leaveGroup(group)" class="leave-btn">Sair</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Grupos Recomendados -->
        <div class="recommended-groups">
          <h4 class="subsection-title">Grupos Recomendados</h4>
          <div class="groups-grid">
            <div 
              v-for="group in recommendedGroups" 
              :key="group.id"
              class="group-card recommended-group"
            >
              <div class="group-header">
                <div class="group-avatar">
                  <img :src="group.avatar" :alt="group.name" class="group-image" />
                  <div v-if="group.isPrivate" class="private-badge">🔒</div>
                  <div v-if="group.isTrending" class="trending-badge">🔥</div>
                </div>
                <div class="group-info">
                  <h5 class="group-name">{{ group.name }}</h5>
                  <p class="group-description">{{ group.description }}</p>
                </div>
                <div class="group-category">{{ group.category }}</div>
              </div>

              <div class="group-stats">
                <div class="stat">
                  <span class="stat-number">{{ formatNumber(group.members) }}</span>
                  <span class="stat-label">membros</span>
                </div>
                <div class="stat">
                  <span class="stat-number">{{ group.posts }</span>
                  <span class="stat-label">posts/dia</span>
                </div>
                <div class="stat">
                  <span class="stat-number">{{ formatPercentage(group.growth) }}</span>
                  <span class="stat-label">crescimento</span>
                </div>
              </div>

              <div class="group-preview">
                <h6 class="preview-title">Tópicos Populares</h6>
                <div class="popular-topics">
                  <span 
                    v-for="topic in group.popularTopics" 
                    :key="topic"
                    class="popular-topic"
                  >
                    {{ topic }}
                  </span>
                </div>
              </div>

              <div class="group-actions">
                <button @click="joinGroup(group)" class="join-btn">
                  {{ group.isPrivate ? 'Solicitar Entrada' : 'Entrar no Grupo' }}
                </button>
                <button @click="previewGroup(group)" class="preview-btn">Visualizar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Competitions -->
    <div v-if="activeTab === 'competitions'" class="tab-content">
      <div class="competitions-section">
        <div class="section-header">
          <h3 class="section-title">Competições de Trading</h3>
          <p class="section-subtitle">Participe de competições e desafie outros investidores</p>
          <button @click="showNewCompetitionModal = true" class="new-competition-btn">
            + Criar Competição
          </button>
        </div>

        <!-- Competições Ativas -->
        <div class="active-competitions">
          <h4 class="subsection-title">Competições Ativas</h4>
          <div class="competitions-grid">
            <div 
              v-for="competition in activeCompetitions" 
              :key="competition.id"
              class="competition-card"
            >
              <div class="competition-header">
                <div class="competition-info">
                  <h5 class="competition-title">{{ competition.title }}</h5>
                  <p class="competition-description">{{ competition.description }}</p>
                </div>
                <div class="competition-status" :class="competition.status">
                  {{ getCompetitionStatusLabel(competition.status) }}
                </div>
              </div>

              <div class="competition-details">
                <div class="detail-item">
                  <span class="detail-label">Duração:</span>
                  <span class="detail-value">{{ competition.duration }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Participantes:</span>
                  <span class="detail-value">{{ formatNumber(competition.participants) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Capital Inicial:</span>
                  <span class="detail-value">{{ formatCurrency(competition.initialCapital) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Prêmio:</span>
                  <span class="detail-value">{{ competition.prize }}</span>
                </div>
              </div>

              <div class="competition-leaderboard">
                <h6 class="leaderboard-title">Top 3 Atual</h6>
                <div class="leaderboard-list">
                  <div 
                    v-for="(leader, index) in competition.leaderboard.slice(0, 3)" 
                    :key="leader.id"
                    class="leader-item"
                  >
                    <div class="leader-position">{{ index + 1 }}º</div>
                    <div class="leader-info">
                      <img :src="leader.avatar" :alt="leader.name" class="leader-avatar" />
                      <span class="leader-name">{{ leader.name }}</span>
                    </div>
                    <div class="leader-performance" :class="{ positive: leader.return > 0, negative: leader.return < 0 }">
                      {{ formatPercentage(leader.return) }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="competition-actions">
                <button 
                  v-if="!competition.isParticipating"
                  @click="joinCompetition(competition)"
                  class="join-competition-btn"
                >
                  Participar
                </button>
                <button 
                  v-else
                  @click="viewCompetition(competition)"
                  class="view-competition-btn"
                >
                  Ver Minha Performance
                </button>
                <button @click="shareCompetition(competition)" class="share-btn">Compartilhar</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Minhas Competições -->
        <div class="my-competitions">
          <h4 class="subsection-title">Minhas Competições</h4>
          <div class="my-competitions-list">
            <div 
              v-for="competition in myCompetitions" 
              :key="competition.id"
              class="my-competition-item"
            >
              <div class="competition-summary">
                <div class="summary-info">
                  <h5 class="summary-title">{{ competition.title }}</h5>
                  <div class="summary-meta">
                    <span class="meta-item">Posição: {{ competition.myPosition }}º de {{ competition.totalParticipants }}</span>
                    <span class="meta-item">Performance: 
                      <span :class="{ positive: competition.myReturn > 0, negative: competition.myReturn < 0 }">
                        {{ formatPercentage(competition.myReturn) }}
                      </span>
                    </span>
                  </div>
                </div>
                <div class="summary-chart">
                  <canvas :ref="`competition-chart-${competition.id}`" class="performance-chart"></canvas>
                </div>
              </div>

              <div class="competition-portfolio">
                <h6 class="portfolio-title">Meu Portfolio na Competição</h6>
                <div class="portfolio-assets">
                  <div 
                    v-for="asset in competition.myPortfolio" 
                    :key="asset.symbol"
                    class="asset-item"
                  >
                    <span class="asset-symbol">{{ asset.symbol }}</span>
                    <span class="asset-allocation">{{ formatPercentage(asset.allocation) }}</span>
                    <span class="asset-return" :class="{ positive: asset.return > 0, negative: asset.return < 0 }">
                      {{ formatPercentage(asset.return) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Modal Novo Tópico -->
    <div v-if="showNewTopicModal" class="modal-overlay" @click="showNewTopicModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Criar Novo Tópico</h3>
          <button @click="showNewTopicModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createTopic">
            <div class="form-group">
              <label class="form-label">Título do Tópico</label>
              <input 
                v-model="newTopic.title"
                type="text"
                placeholder="Digite o título do seu tópico..."
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Categoria</label>
              <select v-model="newTopic.category" class="form-select" required>
                <option value="">Selecione uma categoria</option>
                <option v-for="category in forumCategories" :key="category.id" :value="category.id">
                  {{ category.name }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Conteúdo</label>
              <textarea 
                v-model="newTopic.content"
                placeholder="Escreva o conteúdo do seu tópico..."
                class="form-textarea"
                rows="6"
                required
              ></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Tags (separadas por vírgula)</label>
              <input 
                v-model="newTopic.tags"
                type="text"
                placeholder="análise, estratégia, dúvida..."
                class="form-input"
              />
            </div>
            <div class="form-actions">
              <button type="button" @click="showNewTopicModal = false" class="cancel-btn">Cancelar</button>
              <button type="submit" class="submit-btn">Criar Tópico</button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Modal Novo Artigo -->
    <div v-if="showNewArticleModal" class="modal-overlay" @click="showNewArticleModal = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3 class="modal-title">Compartilhar Conhecimento</h3>
          <button @click="showNewArticleModal = false" class="modal-close">✕</button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="createArticle">
            <div class="form-group">
              <label class="form-label">Tipo de Conteúdo</label>
              <select v-model="newArticle.type" class="form-select" required>
                <option value="">Selecione o tipo</option>
                <option value="analysis">Análise</option>
                <option value="tutorial">Tutorial</option>
                <option value="insight">Insight</option>
                <option value="strategy">Estratégia</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Título</label>
              <input 
                v-model="newArticle.title"
                type="text"
                placeholder="Digite o título do seu conteúdo..."
                class="form-input"
                required
              />
            </div>
            <div class="form-group">
              <label class="form-label">Descrição</label>
              <textarea 
                v-model="newArticle.description"
                placeholder="Breve descrição do conteúdo..."
                class="form-textarea"
                rows="3"
                required
              ></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Conteúdo Completo</label>
              <textarea 
                v-model="newArticle.content"
                placeholder="Escreva o conteúdo completo..."
                class="form-textarea"
                rows="10"
                required
              ></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Tags (separadas por vírgula)</label>
              <input 
                v-model="newArticle.tags"
                type="text"
                placeholder="value investing, análise fundamentalista..."
                class="form-input"
              />
            </div>
            <div class="form-actions">
              <button type="button" @click="showNewArticleModal = false" class="cancel-btn">Cancelar</button>
              <button type="submit" class="submit-btn">Publicar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import Chart from 'chart.js/auto'

export default {
  name: 'CollaborativeFeatures',
  setup() {
    const activeTab = ref('social-trading')
    const selectedCategory = ref('all')
    const knowledgeFilter = ref('all')
    const knowledgeSort = ref('recent')
    
    // Modals
    const showNewTopicModal = ref(false)
    const showNewArticleModal = ref(false)
    const showNewGroupModal = ref(false)
    const showNewCompetitionModal = ref(false)

    // Forms
    const newTopic = reactive({
      title: '',
      category: '',
      content: '',
      tags: ''
    })

    const newArticle = reactive({
      type: '',
      title: '',
      description: '',
      content: '',
      tags: ''
    })

    const tabs = [
      { id: 'social-trading', label: 'Social Trading', icon: '👥', badge: null },
      { id: 'forum', label: 'Fórum', icon: '💬', badge: '12' },
      { id: 'knowledge', label: 'Conhecimento', icon: '📚', badge: null },
      { id: 'groups', label: 'Grupos', icon: '👨‍👩‍👧‍👦', badge: '3' },
      { id: 'competitions', label: 'Competições', icon: '🏆', badge: '2' }
    ]

    // Social Trading Data
    const topTraders = reactive([
      {
        id: 1,
        name: 'Carlos Silva',
        title: 'Value Investor',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
        verified: true,
        followers: 15420,
        experience: 12,
        return30d: 0.0847,
        sharpeRatio: 1.85,
        maxDrawdown: -0.0923,
        winRate: 0.68,
        strategy: 'Foco em empresas subvalorizadas com fundamentos sólidos e dividendos consistentes',
        tags: ['Value', 'Dividendos', 'Long Term'],
        isFollowing: false,
        isCopying: false,
        copyAmount: 1000,
        autoRebalance: true
      },
      {
        id: 2,
        name: 'Ana Costa',
        title: 'Growth Specialist',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
        verified: true,
        followers: 8930,
        experience: 8,
        return30d: 0.1234,
        sharpeRatio: 2.12,
        maxDrawdown: -0.1456,
        winRate: 0.72,
        strategy: 'Investimento em empresas de crescimento com foco em tecnologia e inovação',
        tags: ['Growth', 'Tech', 'Innovation'],
        isFollowing: true,
        isCopying: true,
        copyAmount: 2500,
        autoRebalance: false
      },
      {
        id: 3,
        name: 'Roberto Lima',
        title: 'Quantitative Analyst',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
        verified: true,
        followers: 12750,
        experience: 15,
        return30d: 0.0692,
        sharpeRatio: 1.67,
        maxDrawdown: -0.0834,
        winRate: 0.65,
        strategy: 'Estratégias quantitativas baseadas em análise técnica e momentum',
        tags: ['Quantitative', 'Technical', 'Momentum'],
        isFollowing: false,
        isCopying: false,
        copyAmount: 1500,
        autoRebalance: true
      }
    ])

    const socialPortfolio = reactive({
      followedTraders: 5,
      copiedStrategies: 2,
      totalCopied: 15000,
      performance: 0.0923
    })

    const copiedStrategies = reactive([
      {
        id: 1,
        traderName: 'Ana Costa',
        traderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
        name: 'Growth Tech Strategy',
        amount: 2500,
        performance: 0.1234
      },
      {
        id: 2,
        traderName: 'Carlos Silva',
        traderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
        name: 'Value Dividend Strategy',
        amount: 1000,
        performance: 0.0847
      }
    ])

    // Forum Data
    const forumCategories = [
      { id: 'all', name: 'Todas', icon: '📋', topicCount: 1247 },
      { id: 'analysis', name: 'Análises', icon: '📊', topicCount: 342 },
      { id: 'strategies', name: 'Estratégias', icon: '🎯', topicCount: 189 },
      { id: 'questions', name: 'Dúvidas', icon: '❓', topicCount: 456 },
      { id: 'news', name: 'Notícias', icon: '📰', topicCount: 123 },
      { id: 'general', name: 'Geral', icon: '💭', topicCount: 137 }
    ]

    const forumTopics = reactive([
      {
        id: 1,
        title: 'Análise da PETR4: Vale a pena investir agora?',
        author: 'João Investidor',
        category: 'analysis',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        replies: 23,
        views: 456,
        likes: 12,
        excerpt: 'Com a recente queda do petróleo, será que a Petrobras está numa boa oportunidade de compra? Vamos analisar os fundamentos...',
        tags: ['PETR4', 'Petróleo', 'Análise'],
        lastReply: {
          author: 'Maria Analista',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=30&h=30&fit=crop&crop=face',
          date: new Date(Date.now() - 15 * 60 * 1000)
        }
      },
      {
        id: 2,
        title: 'Estratégia de Dollar Cost Averaging funciona no Brasil?',
        author: 'Pedro Santos',
        category: 'strategies',
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        replies: 18,
        views: 289,
        likes: 8,
        excerpt: 'Tenho visto muita gente falando sobre DCA, mas será que funciona mesmo no mercado brasileiro? Compartilho minha experiência...',
        tags: ['DCA', 'Estratégia', 'Aportes'],
        lastReply: {
          author: 'Carlos Expert',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=30&h=30&fit=crop&crop=face',
          date: new Date(Date.now() - 45 * 60 * 1000)
        }
      }
    ])

    // Knowledge Data
    const knowledgeItems = reactive([
      {
        id: 1,
        type: 'analysis',
        title: 'Análise Completa do Setor Bancário Brasileiro',
        description: 'Uma análise detalhada dos principais bancos brasileiros e suas perspectivas para 2024',
        author: {
          name: 'Dr. Fernando Oliveira',
          title: 'Analista Sênior',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face',
          verified: true
        },
        rating: 4.8,
        views: 15420,
        likes: 892,
        comments: 156,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        tags: ['Bancos', 'Setor Financeiro', 'Análise Fundamentalista'],
        isLiked: false,
        isSaved: false
      },
      {
        id: 2,
        type: 'tutorial',
        title: 'Como Calcular o Valor Intrínseco de uma Ação',
        description: 'Tutorial passo a passo para calcular o valor justo de uma empresa usando DCF',
        author: {
          name: 'Prof. Marina Silva',
          title: 'Educadora Financeira',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face',
          verified: true
        },
        rating: 4.9,
        views: 23150,
        likes: 1247,
        comments: 203,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        tags: ['DCF', 'Valuation', 'Tutorial', 'Value Investing'],
        isLiked: true,
        isSaved: true
      }
    ])

    // Groups Data
    const myGroups = reactive([
      {
        id: 1,
        name: 'Value Investors Brasil',
        description: 'Grupo dedicado ao value investing no mercado brasileiro',
        avatar: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=80&h=80&fit=crop',
        isPrivate: false,
        myRole: 'Moderador',
        members: 2847,
        posts: 156,
        activity: 'Alta',
        recentPosts: [
          { id: 1, author: 'Carlos Silva', title: 'Análise da VALE3', time: new Date(Date.now() - 30 * 60 * 1000) },
          { id: 2, author: 'Ana Costa', title: 'Dividendos de dezembro', time: new Date(Date.now() - 2 * 60 * 60 * 1000) }
        ]
      },
      {
        id: 2,
        name: 'Tech Stocks BR',
        description: 'Discussões sobre ações de tecnologia brasileiras e internacionais',
        avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=80&h=80&fit=crop',
        isPrivate: false,
        myRole: 'Membro',
        members: 1523,
        posts: 89,
        activity: 'Média',
        recentPosts: [
          { id: 1, author: 'Roberto Tech', title: 'MGLU3 vs AMER3', time: new Date(Date.now() - 45 * 60 * 1000) },
          { id: 2, author: 'Julia Dev', title: 'IPO da Nubank', time: new Date(Date.now() - 3 * 60 * 60 * 1000) }
        ]
      }
    ])

    const recommendedGroups = reactive([
      {
        id: 3,
        name: 'Dividendos e FIIs',
        description: 'Foco em investimentos de renda passiva através de dividendos e fundos imobiliários',
        avatar: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=80&h=80&fit=crop',
        isPrivate: false,
        isTrending: true,
        category: 'Renda Passiva',
        members: 5234,
        posts: 45,
        growth: 0.23,
        popularTopics: ['KNRI11', 'HGLG11', 'Dividendos', 'REITs']
      },
      {
        id: 4,
        name: 'Análise Técnica Avançada',
        description: 'Grupo privado para discussões avançadas de análise técnica',
        avatar: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=80&h=80&fit=crop',
        isPrivate: true,
        isTrending: false,
        category: 'Análise Técnica',
        members: 892,
        posts: 23,
        growth: 0.15,
        popularTopics: ['Candlesticks', 'Fibonacci', 'Elliott Wave', 'Volume']
      }
    ])

    // Competitions Data
    const activeCompetitions = reactive([
      {
        id: 1,
        title: 'Desafio Value Investing 2024',
        description: 'Competição de 3 meses focada em estratégias de value investing',
        status: 'active',
        duration: '3 meses',
        participants: 1247,
        initialCapital: 100000,
        prize: 'R$ 10.000 + Certificado',
        isParticipating: true,
        leaderboard: [
          { id: 1, name: 'Carlos Silva', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face', return: 0.1234 },
          { id: 2, name: 'Ana Costa', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face', return: 0.1156 },
          { id: 3, name: 'Roberto Lima', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face', return: 0.1089 }
        ]
      },
      {
        id: 2,
        title: 'Trading Semanal',
        description: 'Competição semanal de trading com foco em day trade',
        status: 'registration',
        duration: '1 semana',
        participants: 456,
        initialCapital: 10000,
        prize: 'R$ 1.000',
        isParticipating: false,
        leaderboard: []
      }
    ])

    const myCompetitions = reactive([
      {
        id: 1,
        title: 'Desafio Value Investing 2024',
        myPosition: 23,
        totalParticipants: 1247,
        myReturn: 0.0892,
        myPortfolio: [
          { symbol: 'PETR4', allocation: 0.25, return: 0.12 },
          { symbol: 'VALE3', allocation: 0.20, return: 0.08 },
          { symbol: 'ITUB4', allocation: 0.15, return: 0.06 },
          { symbol: 'BBDC4', allocation: 0.15, return: 0.04 },
          { symbol: 'CASH', allocation: 0.25, return: 0.00 }
        ]
      }
    ])

    // Computed
    const filteredTopics = computed(() => {
      if (selectedCategory.value === 'all') {
        return forumTopics
      }
      return forumTopics.filter(topic => topic.category === selectedCategory.value)
    })

    const filteredKnowledge = computed(() => {
      let filtered = knowledgeItems

      if (knowledgeFilter.value !== 'all') {
        filtered = filtered.filter(item => item.type === knowledgeFilter.value)
      }

      // Sort
      switch (knowledgeSort.value) {
        case 'popular':
          filtered = filtered.sort((a, b) => b.likes - a.likes)
          break
        case 'trending':
          filtered = filtered.sort((a, b) => b.views - a.views)
          break
        case 'rating':
          filtered = filtered.sort((a, b) => b.rating - a.rating)
          break
        default: // recent
          filtered = filtered.sort((a, b) => b.publishedAt - a.publishedAt)
      }

      return filtered
    })

    // Methods
    const followTrader = (trader) => {
      trader.isFollowing = !trader.isFollowing
      if (!trader.isFollowing) {
        trader.isCopying = false
      }
    }

    const copyTrader = (trader) => {
      if (!trader.isFollowing) {
        trader.isFollowing = true
      }
      trader.isCopying = !trader.isCopying
    }

    const adjustCopy = (strategy) => {
      alert(`Ajustando configurações de cópia para ${strategy.name}`)
    }

    const stopCopy = (strategy) => {
      if (confirm(`Deseja parar de copiar a estratégia ${strategy.name}?`)) {
        const index = copiedStrategies.findIndex(s => s.id === strategy.id)
        if (index > -1) {
          copiedStrategies.splice(index, 1)
        }
      }
    }

    const openTopic = (topic) => {
      alert(`Abrindo tópico: ${topic.title}`)
    }

    const getCategoryName = (categoryId) => {
      const category = forumCategories.find(c => c.id === categoryId)
      return category ? category.name : ''
    }

    const createTopic = () => {
      // Simulate topic creation
      const topic = {
        id: Date.now(),
        title: newTopic.title,
        author: 'Você',
        category: newTopic.category,
        createdAt: new Date(),
        replies: 0,
        views: 1,
        likes: 0,
        excerpt: newTopic.content.substring(0, 100) + '...',
        tags: newTopic.tags.split(',').map(tag => tag.trim()),
        lastReply: {
          author: 'Você',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=30&h=30&fit=crop&crop=face',
          date: new Date()
        }
      }

      forumTopics.unshift(topic)
      showNewTopicModal.value = false
      
      // Reset form
      Object.keys(newTopic).forEach(key => {
        newTopic[key] = ''
      })
    }

    const getTypeLabel = (type) => {
      const labels = {
        analysis: 'Análise',
        tutorial: 'Tutorial',
        insight: 'Insight',
        strategy: 'Estratégia'
      }
      return labels[type] || type
    }

    const readKnowledge = (item) => {
      alert(`Lendo: ${item.title}`)
    }

    const likeKnowledge = (item) => {
      item.isLiked = !item.isLiked
      item.likes += item.isLiked ? 1 : -1
    }

    const saveKnowledge = (item) => {
      item.isSaved = !item.isSaved
    }

    const createArticle = () => {
      // Simulate article creation
      const article = {
        id: Date.now(),
        type: newArticle.type,
        title: newArticle.title,
        description: newArticle.description,
        author: {
          name: 'Você',
          title: 'Investidor',
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face',
          verified: false
        },
        rating: 0,
        views: 0,
        likes: 0,
        comments: 0,
        publishedAt: new Date(),
        tags: newArticle.tags.split(',').map(tag => tag.trim()),
        isLiked: false,
        isSaved: false
      }

      knowledgeItems.unshift(article)
      showNewArticleModal.value = false
      
      // Reset form
      Object.keys(newArticle).forEach(key => {
        newArticle[key] = ''
      })
    }

    const enterGroup = (group) => {
      alert(`Entrando no grupo: ${group.name}`)
    }

    const leaveGroup = (group) => {
      if (confirm(`Deseja sair do grupo ${group.name}?`)) {
        const index = myGroups.findIndex(g => g.id === group.id)
        if (index > -1) {
          myGroups.splice(index, 1)
        }
      }
    }

    const joinGroup = (group) => {
      alert(`${group.isPrivate ? 'Solicitando entrada no' : 'Entrando no'} grupo: ${group.name}`)
    }

    const previewGroup = (group) => {
      alert(`Visualizando grupo: ${group.name}`)
    }

    const getCompetitionStatusLabel = (status) => {
      const labels = {
        active: 'Ativa',
        registration: 'Inscrições Abertas',
        finished: 'Finalizada'
      }
      return labels[status] || status
    }

    const joinCompetition = (competition) => {
      competition.isParticipating = true
      competition.participants += 1
      alert(`Você se inscreveu na competição: ${competition.title}`)
    }

    const viewCompetition = (competition) => {
      alert(`Visualizando sua performance na competição: ${competition.title}`)
    }

    const shareCompetition = (competition) => {
      alert(`Compartilhando competição: ${competition.title}`)
    }

    // Utility functions
    const formatNumber = (num) => {
      return new Intl.NumberFormat('pt-BR').format(num)
    }

    const formatPercentage = (value) => {
      return `${(value * 100).toFixed(2)}%`
    }

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value)
    }

    const formatDate = (date) => {
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(date)
    }

    const formatTime = (date) => {
      const now = new Date()
      const diff = now - date
      const minutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const days = Math.floor(diff / (1000 * 60 * 60 * 24))

      if (minutes < 60) {
        return `${minutes}m atrás`
      } else if (hours < 24) {
        return `${hours}h atrás`
      } else {
        return `${days}d atrás`
      }
    }

    onMounted(() => {
      // Initialize charts for competitions
      setTimeout(() => {
        myCompetitions.forEach(competition => {
          const canvas = document.querySelector(`[ref="competition-chart-${competition.id}"]`)
          if (canvas) {
            new Chart(canvas, {
              type: 'line',
              data: {
                labels: ['Início', 'Semana 1', 'Semana 2', 'Semana 3', 'Atual'],
                datasets: [{
                  label: 'Performance',
                  data: [0, 0.02, 0.05, 0.07, competition.myReturn],
                  borderColor: '#667eea',
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  tension: 0.4
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { 
                    beginAtZero: true,
                    ticks: {
                      callback: function(value) {
                        return (value * 100).toFixed(1) + '%'
                      }
                    }
                  }
                },
                plugins: {
                  legend: { display: false }
                }
              }
            })
          }
        })
      }, 100)
    })

    return {
      activeTab,
      selectedCategory,
      knowledgeFilter,
      knowledgeSort,
      showNewTopicModal,
      showNewArticleModal,
      showNewGroupModal,
      showNewCompetitionModal,
      newTopic,
      newArticle,
      tabs,
      topTraders,
      socialPortfolio,
      copiedStrategies,
      forumCategories,
      filteredTopics,
      filteredKnowledge,
      myGroups,
      recommendedGroups,
      activeCompetitions,
      myCompetitions,
      followTrader,
      copyTrader,
      adjustCopy,
      stopCopy,
      openTopic,
      getCategoryName,
      createTopic,
      getTypeLabel,
      readKnowledge,
      likeKnowledge,
      saveKnowledge,
      createArticle,
      enterGroup,
      leaveGroup,
      joinGroup,
      previewGroup,
      getCompetitionStatusLabel,
      joinCompetition,
      viewCompetition,
      shareCompetition,
      formatNumber,
      formatPercentage,
      formatCurrency,
      formatDate,
      formatTime
    }
  }
}
</script>

<style scoped>
.collaborative-features {
  background: #f8fafc;
  min-height: 100vh;
  padding: 24px;
}

.features-header {
  background: white;
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.header-title {
  font-size: 2rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.header-subtitle {
  font-size: 1.125rem;
  color: #6b7280;
  margin: 0;
}

.features-tabs {
  display: flex;
  background: white;
  border-radius: 12px;
  padding: 8px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  gap: 4px;
}

.tab-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.tab-button:hover {
  background: #f3f4f6;
  color: #374151;
}

.tab-button.active {
  background: #667eea;
  color: white;
}

.tab-icon {
  font-size: 1rem;
}

.tab-badge {
  background: #ef4444;
  color: white;
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 18px;
  text-align: center;
}

.tab-button.active .tab-badge {
  background: rgba(255, 255, 255, 0.3);
}

.tab-content {
  background: white;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.section-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.new-topic-btn,
.new-article-btn,
.new-group-btn,
.new-competition-btn {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.new-topic-btn:hover,
.new-article-btn:hover,
.new-group-btn:hover,
.new-competition-btn:hover {
  background: #5a67d8;
}

.subsection-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 20px 0;
}

/* Social Trading Styles */
.traders-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.trader-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}

.trader-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.trader-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.trader-avatar {
  position: relative;
  flex-shrink: 0;
}

.avatar-image {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.verified-badge {
  position: absolute;
  bottom: -2px;
  right: -2px;
  background: #10b981;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.trader-info {
  flex: 1;
}

.trader-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.trader-title {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.trader-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.trader-actions {
  flex-shrink: 0;
}

.follow-btn {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.follow-btn:hover {
  background: #5a67d8;
}

.follow-btn.following {
  background: #10b981;
}

.trader-performance {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.performance-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
}

.metric-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.metric-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.metric-value.positive {
  color: #10b981;
}

.metric-value.negative {
  color: #ef4444;
}

.trader-strategy {
  margin-bottom: 16px;
}

.strategy-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.strategy-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.strategy-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.strategy-tag {
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.trader-copy {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.copy-btn {
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 10px 20px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  margin-bottom: 12px;
  transition: background 0.2s;
}

.copy-btn:hover:not(:disabled) {
  background: #059669;
}

.copy-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.copy-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.copy-setting {
  display: flex;
  align-items: center;
  gap: 8px;
}

.setting-label {
  font-size: 0.875rem;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 6px;
}

.setting-input {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  width: 100px;
}

.setting-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
}

.setting-text {
  font-size: 0.875rem;
  color: #374151;
}

.social-portfolio {
  margin-top: 40px;
}

.portfolio-summary {
  margin-bottom: 24px;
}

.summary-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.summary-metric {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
}

.copied-strategies {
  margin-top: 24px;
}

.strategies-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.strategies-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.strategy-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.strategy-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.strategy-trader {
  display: flex;
  align-items: center;
  gap: 8px;
}

.trader-mini-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.trader-mini-name {
  font-size: 0.875rem;
  color: #6b7280;
}

.strategy-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.strategy-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.strategy-amount {
  font-size: 0.875rem;
  color: #6b7280;
}

.strategy-performance {
  flex-shrink: 0;
}

.performance-value {
  font-size: 1rem;
  font-weight: 600;
}

.strategy-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.adjust-btn,
.stop-btn {
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.adjust-btn:hover {
  background: #f3f4f6;
}

.stop-btn:hover {
  background: #fee2e2;
  border-color: #ef4444;
}

/* Forum Styles */
.forum-categories {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.category-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.category-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.category-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.category-icon {
  font-size: 1rem;
}

.category-count {
  background: rgba(0, 0, 0, 0.1);
  color: inherit;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.topics-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.topic-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
}

.topic-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.topic-info {
  flex: 1;
}

.topic-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.topic-meta {
  display: flex;
  gap: 16px;
  font-size: 0.875rem;
  color: #6b7280;
}

.topic-stats {
  display: flex;
  gap: 16px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-number {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.topic-preview {
  margin-bottom: 12px;
}

.topic-excerpt {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.topic-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.topic-tag {
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.topic-last-activity {
  border-top: 1px solid #e5e7eb;
  padding-top: 12px;
}

.last-reply {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reply-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.reply-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.reply-author {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.reply-date {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Knowledge Styles */
.knowledge-filters {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
}

.knowledge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.knowledge-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}

.knowledge-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.knowledge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.knowledge-type {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
}

.knowledge-type.analysis {
  background: #3b82f6;
}

.knowledge-type.tutorial {
  background: #10b981;
}

.knowledge-type.insight {
  background: #f59e0b;
}

.knowledge-type.strategy {
  background: #8b5cf6;
}

.knowledge-rating {
  display: flex;
  align-items: center;
  gap: 4px;
}

.rating-stars {
  color: #fbbf24;
  font-size: 0.875rem;
}

.rating-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.knowledge-content {
  margin-bottom: 16px;
}

.knowledge-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.knowledge-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.knowledge-author {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.author-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  display: block;
}

.author-title {
  font-size: 0.75rem;
  color: #6b7280;
}

.author-verified {
  background: #10b981;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.knowledge-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: #6b7280;
}

.stat-icon {
  font-size: 0.875rem;
}

.knowledge-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.knowledge-tag {
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.knowledge-actions {
  display: flex;
  gap: 8px;
}

.read-btn,
.like-btn,
.save-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.read-btn {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.read-btn:hover {
  background: #5a67d8;
}

.like-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.like-btn.liked {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.save-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.save-btn.saved {
  background: #ecfdf5;
  color: #059669;
  border-color: #a7f3d0;
}

/* Groups Styles */
.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.group-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}

.group-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.group-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.group-avatar {
  position: relative;
  flex-shrink: 0;
}

.group-image {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  object-fit: cover;
}

.private-badge,
.trending-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  background: #ef4444;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
}

.trending-badge {
  background: #f59e0b;
}

.group-info {
  flex: 1;
}

.group-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.group-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.group-role,
.group-category {
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  flex-shrink: 0;
}

.group-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
  padding: 12px;
  background: white;
  border-radius: 6px;
}

.group-recent,
.group-preview {
  margin-bottom: 16px;
}

.recent-title,
.preview-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.recent-posts {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.recent-post {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: #6b7280;
}

.post-author {
  font-weight: 500;
  color: #374151;
}

.post-title {
  flex: 1;
  margin: 0 8px;
  color: #6b7280;
}

.popular-topics {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.popular-topic {
  background: #e0e7ff;
  color: #3730a3;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.group-actions {
  display: flex;
  gap: 8px;
}

.enter-btn,
.leave-btn,
.join-btn,
.preview-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.enter-btn,
.join-btn {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.enter-btn:hover,
.join-btn:hover {
  background: #5a67d8;
}

.leave-btn:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fecaca;
}

.preview-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* Competitions Styles */
.competitions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.competition-card {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
}

.competition-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.competition-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.competition-info {
  flex: 1;
}

.competition-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.competition-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.competition-status {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  color: white;
}

.competition-status.active {
  background: #10b981;
}

.competition-status.registration {
  background: #3b82f6;
}

.competition-status.finished {
  background: #6b7280;
}

.competition-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
}

.detail-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.competition-leaderboard {
  margin-bottom: 16px;
}

.leaderboard-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.leader-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
}

.leader-position {
  font-size: 0.875rem;
  font-weight: 600;
  color: #667eea;
  min-width: 24px;
}

.leader-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.leader-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.leader-name {
  font-size: 0.875rem;
  color: #111827;
}

.leader-performance {
  font-size: 0.875rem;
  font-weight: 600;
}

.competition-actions {
  display: flex;
  gap: 8px;
}

.join-competition-btn,
.view-competition-btn,
.share-btn {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #6b7280;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.join-competition-btn {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.join-competition-btn:hover {
  background: #5a67d8;
}

.view-competition-btn {
  background: #10b981;
  color: white;
  border-color: #10b981;
}

.view-competition-btn:hover {
  background: #059669;
}

.share-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.my-competitions-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.my-competition-item {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
}

.competition-summary {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
}

.summary-info {
  flex: 1;
}

.summary-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.summary-meta {
  display: flex;
  gap: 16px;
  font-size: 0.875rem;
  color: #6b7280;
}

.meta-item {
  display: flex;
  gap: 4px;
}

.summary-chart {
  width: 200px;
  height: 100px;
}

.performance-chart {
  width: 100%;
  height: 100%;
}

.competition-portfolio {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
}

.portfolio-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.portfolio-assets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}

.asset-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 12px;
  background: white;
  border-radius: 6px;
  text-align: center;
}

.asset-symbol {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.asset-allocation {
  font-size: 0.75rem;
  color: #6b7280;
}

.asset-return {
  font-size: 0.75rem;
  font-weight: 600;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 4px;
}

.modal-close:hover {
  color: #374151;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  background: white;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-btn,
.submit-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: transparent;
  border: 1px solid #d1d5db;
  color: #6b7280;
}

.cancel-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.submit-btn {
  background: #667eea;
  border: 1px solid #667eea;
  color: white;
}

.submit-btn:hover {
  background: #5a67d8;
}

/* Responsividade */
@media (max-width: 768px) {
  .collaborative-features {
    padding: 16px;
  }

  .features-header {
    padding: 20px;
  }

  .features-tabs {
    flex-direction: column;
  }

  .tab-content {
    padding: 20px;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .traders-grid,
  .groups-grid,
  .competitions-grid,
  .knowledge-grid {
    grid-template-columns: 1fr;
  }

  .trader-header,
  .group-header,
  .competition-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .trader-performance,
  .competition-details {
    grid-template-columns: 1fr;
  }

  .summary-card {
    grid-template-columns: repeat(2, 1fr);
  }

  .forum-categories {
    flex-direction: column;
  }

  .knowledge-filters {
    flex-direction: column;
  }

  .modal-content {
    width: 95%;
    margin: 20px;
  }

  .modal-body {
    padding: 16px;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>

