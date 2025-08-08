<template>
  <div class="methodology-builder">
    <div class="builder-header">
      <h2 class="header-title">Construtor de Metodologias</h2>
      <p class="header-subtitle">Crie suas próprias estratégias de investimento personalizadas</p>
    </div>

    <!-- Wizard de Criação -->
    <div class="builder-wizard">
      <div class="wizard-steps">
        <div 
          v-for="(step, index) in wizardSteps" 
          :key="step.id"
          class="wizard-step"
          :class="{ 
            active: currentStep === index, 
            completed: index < currentStep,
            disabled: index > currentStep 
          }"
          @click="goToStep(index)"
        >
          <div class="step-number">
            <span v-if="index < currentStep" class="step-check">✓</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="step-info">
            <span class="step-title">{{ step.title }}</span>
            <span class="step-description">{{ step.description }}</span>
          </div>
        </div>
      </div>

      <!-- Conteúdo do Step -->
      <div class="wizard-content">
        <!-- Step 1: Informações Básicas -->
        <div v-if="currentStep === 0" class="step-content">
          <h3 class="step-heading">Informações Básicas da Metodologia</h3>
          
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">Nome da Metodologia</label>
              <input 
                v-model="methodology.name"
                type="text"
                placeholder="Ex: Minha Estratégia Value"
                class="form-input"
                @input="validateStep"
              />
              <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Categoria</label>
              <select v-model="methodology.category" class="form-select" @change="validateStep">
                <option value="">Selecione uma categoria</option>
                <option value="value">Value Investing</option>
                <option value="growth">Growth Investing</option>
                <option value="dividend">Dividend Investing</option>
                <option value="momentum">Momentum</option>
                <option value="contrarian">Contrarian</option>
                <option value="quality">Quality</option>
                <option value="hybrid">Híbrida</option>
              </select>
              <span v-if="errors.category" class="error-message">{{ errors.category }}</span>
            </div>

            <div class="form-group full-width">
              <label class="form-label">Descrição</label>
              <textarea 
                v-model="methodology.description"
                placeholder="Descreva sua estratégia de investimento..."
                class="form-textarea"
                rows="4"
                @input="validateStep"
              ></textarea>
              <span v-if="errors.description" class="error-message">{{ errors.description }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Perfil de Risco</label>
              <div class="risk-selector">
                <label 
                  v-for="risk in riskProfiles" 
                  :key="risk.value"
                  class="risk-option"
                  :class="{ selected: methodology.riskProfile === risk.value }"
                >
                  <input 
                    v-model="methodology.riskProfile"
                    :value="risk.value"
                    type="radio"
                    class="risk-radio"
                    @change="validateStep"
                  />
                  <div class="risk-content">
                    <div class="risk-icon" :style="{ backgroundColor: risk.color }">{{ risk.icon }}</div>
                    <div class="risk-info">
                      <span class="risk-name">{{ risk.name }}</span>
                      <span class="risk-description">{{ risk.description }}</span>
                    </div>
                  </div>
                </label>
              </div>
              <span v-if="errors.riskProfile" class="error-message">{{ errors.riskProfile }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">Horizonte de Investimento</label>
              <select v-model="methodology.timeHorizon" class="form-select" @change="validateStep">
                <option value="">Selecione o horizonte</option>
                <option value="short">Curto Prazo (até 1 ano)</option>
                <option value="medium">Médio Prazo (1-5 anos)</option>
                <option value="long">Longo Prazo (5+ anos)</option>
              </select>
              <span v-if="errors.timeHorizon" class="error-message">{{ errors.timeHorizon }}</span>
            </div>
          </div>
        </div>

        <!-- Step 2: Critérios de Seleção -->
        <div v-if="currentStep === 1" class="step-content">
          <h3 class="step-heading">Critérios de Seleção de Ativos</h3>
          
          <div class="criteria-builder">
            <div class="criteria-header">
              <h4 class="criteria-title">Filtros Fundamentalistas</h4>
              <p class="criteria-subtitle">Defina os critérios para seleção inicial dos ativos</p>
            </div>

            <div class="criteria-grid">
              <div 
                v-for="criterion in availableCriteria" 
                :key="criterion.id"
                class="criterion-card"
                :class="{ active: isCriterionActive(criterion.id) }"
                @click="toggleCriterion(criterion)"
              >
                <div class="criterion-header">
                  <div class="criterion-icon">{{ criterion.icon }}</div>
                  <div class="criterion-info">
                    <span class="criterion-name">{{ criterion.name }}</span>
                    <span class="criterion-description">{{ criterion.description }}</span>
                  </div>
                  <div class="criterion-toggle">
                    <input 
                      :checked="isCriterionActive(criterion.id)"
                      type="checkbox"
                      class="toggle-checkbox"
                      @change="toggleCriterion(criterion)"
                    />
                  </div>
                </div>

                <!-- Configuração do Critério -->
                <div v-if="isCriterionActive(criterion.id)" class="criterion-config">
                  <div class="config-row">
                    <label class="config-label">Operador</label>
                    <select 
                      v-model="getCriterionConfig(criterion.id).operator"
                      class="config-select"
                    >
                      <option v-for="op in criterion.operators" :key="op.value" :value="op.value">
                        {{ op.label }}
                      </option>
                    </select>
                  </div>

                  <div class="config-row">
                    <label class="config-label">Valor</label>
                    <input 
                      v-model="getCriterionConfig(criterion.id).value"
                      :type="criterion.inputType"
                      :placeholder="criterion.placeholder"
                      class="config-input"
                    />
                  </div>

                  <div v-if="criterion.hasWeight" class="config-row">
                    <label class="config-label">Peso ({{ getCriterionConfig(criterion.id).weight }}%)</label>
                    <input 
                      v-model="getCriterionConfig(criterion.id).weight"
                      type="range"
                      min="1"
                      max="100"
                      class="config-range"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Resumo dos Critérios -->
            <div v-if="methodology.criteria.length > 0" class="criteria-summary">
              <h4 class="summary-title">Resumo dos Critérios Selecionados</h4>
              <div class="summary-list">
                <div 
                  v-for="criterion in methodology.criteria" 
                  :key="criterion.id"
                  class="summary-item"
                >
                  <span class="summary-name">{{ getCriterionName(criterion.id) }}</span>
                  <span class="summary-condition">
                    {{ getOperatorLabel(criterion.id, criterion.operator) }} {{ criterion.value }}
                  </span>
                  <span v-if="criterion.weight" class="summary-weight">Peso: {{ criterion.weight }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 3: Regras de Entrada -->
        <div v-if="currentStep === 2" class="step-content">
          <h3 class="step-heading">Regras de Entrada</h3>
          
          <div class="rules-builder">
            <div class="rules-header">
              <h4 class="rules-title">Condições para Compra</h4>
              <p class="rules-subtitle">Defina quando um ativo deve ser comprado</p>
            </div>

            <div class="rules-list">
              <div 
                v-for="(rule, index) in methodology.entryRules" 
                :key="index"
                class="rule-item"
              >
                <div class="rule-header">
                  <span class="rule-number">{{ index + 1 }}</span>
                  <select v-model="rule.type" class="rule-select">
                    <option value="">Tipo de Regra</option>
                    <option value="price">Preço</option>
                    <option value="technical">Indicador Técnico</option>
                    <option value="fundamental">Indicador Fundamentalista</option>
                    <option value="market">Condição de Mercado</option>
                    <option value="time">Condição Temporal</option>
                  </select>
                  <button @click="removeRule('entry', index)" class="remove-rule-btn">✕</button>
                </div>

                <!-- Configuração da Regra -->
                <div v-if="rule.type" class="rule-config">
                  <div class="config-grid">
                    <div class="config-item">
                      <label class="config-label">Indicador</label>
                      <select v-model="rule.indicator" class="config-select">
                        <option value="">Selecione</option>
                        <option v-for="indicator in getIndicatorsByType(rule.type)" :key="indicator.value" :value="indicator.value">
                          {{ indicator.label }}
                        </option>
                      </select>
                    </div>

                    <div class="config-item">
                      <label class="config-label">Condição</label>
                      <select v-model="rule.condition" class="config-select">
                        <option value="">Selecione</option>
                        <option value="gt">Maior que</option>
                        <option value="lt">Menor que</option>
                        <option value="eq">Igual a</option>
                        <option value="gte">Maior ou igual</option>
                        <option value="lte">Menor ou igual</option>
                        <option value="between">Entre</option>
                        <option value="cross_above">Cruza acima</option>
                        <option value="cross_below">Cruza abaixo</option>
                      </select>
                    </div>

                    <div class="config-item">
                      <label class="config-label">Valor</label>
                      <input 
                        v-model="rule.value"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        class="config-input"
                      />
                    </div>

                    <div v-if="rule.condition === 'between'" class="config-item">
                      <label class="config-label">Valor Máximo</label>
                      <input 
                        v-model="rule.maxValue"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        class="config-input"
                      />
                    </div>
                  </div>

                  <div class="rule-description">
                    <label class="config-label">Descrição da Regra</label>
                    <input 
                      v-model="rule.description"
                      type="text"
                      placeholder="Ex: Comprar quando P/L < 15"
                      class="config-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button @click="addRule('entry')" class="add-rule-btn">
              + Adicionar Regra de Entrada
            </button>

            <!-- Lógica entre Regras -->
            <div v-if="methodology.entryRules.length > 1" class="rules-logic">
              <h4 class="logic-title">Lógica entre Regras</h4>
              <div class="logic-options">
                <label class="logic-option">
                  <input 
                    v-model="methodology.entryLogic"
                    value="and"
                    type="radio"
                    class="logic-radio"
                  />
                  <span class="logic-label">E (AND) - Todas as regras devem ser atendidas</span>
                </label>
                <label class="logic-option">
                  <input 
                    v-model="methodology.entryLogic"
                    value="or"
                    type="radio"
                    class="logic-radio"
                  />
                  <span class="logic-label">OU (OR) - Pelo menos uma regra deve ser atendida</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 4: Regras de Saída -->
        <div v-if="currentStep === 3" class="step-content">
          <h3 class="step-heading">Regras de Saída</h3>
          
          <div class="rules-builder">
            <div class="rules-header">
              <h4 class="rules-title">Condições para Venda</h4>
              <p class="rules-subtitle">Defina quando um ativo deve ser vendido</p>
            </div>

            <div class="rules-list">
              <div 
                v-for="(rule, index) in methodology.exitRules" 
                :key="index"
                class="rule-item"
              >
                <div class="rule-header">
                  <span class="rule-number">{{ index + 1 }}</span>
                  <select v-model="rule.type" class="rule-select">
                    <option value="">Tipo de Regra</option>
                    <option value="profit_target">Meta de Lucro</option>
                    <option value="stop_loss">Stop Loss</option>
                    <option value="time_exit">Saída por Tempo</option>
                    <option value="technical">Indicador Técnico</option>
                    <option value="fundamental">Indicador Fundamentalista</option>
                    <option value="market">Condição de Mercado</option>
                  </select>
                  <button @click="removeRule('exit', index)" class="remove-rule-btn">✕</button>
                </div>

                <!-- Configuração da Regra -->
                <div v-if="rule.type" class="rule-config">
                  <div v-if="rule.type === 'profit_target'" class="profit-target-config">
                    <div class="config-row">
                      <label class="config-label">Meta de Lucro (%)</label>
                      <input 
                        v-model="rule.percentage"
                        type="number"
                        min="1"
                        max="1000"
                        step="1"
                        placeholder="20"
                        class="config-input"
                      />
                    </div>
                  </div>

                  <div v-else-if="rule.type === 'stop_loss'" class="stop-loss-config">
                    <div class="config-row">
                      <label class="config-label">Stop Loss (%)</label>
                      <input 
                        v-model="rule.percentage"
                        type="number"
                        min="1"
                        max="50"
                        step="1"
                        placeholder="10"
                        class="config-input"
                      />
                    </div>
                    <div class="config-row">
                      <label class="config-label">Tipo de Stop</label>
                      <select v-model="rule.stopType" class="config-select">
                        <option value="fixed">Fixo</option>
                        <option value="trailing">Trailing Stop</option>
                      </select>
                    </div>
                  </div>

                  <div v-else-if="rule.type === 'time_exit'" class="time-exit-config">
                    <div class="config-row">
                      <label class="config-label">Período Máximo</label>
                      <input 
                        v-model="rule.period"
                        type="number"
                        min="1"
                        placeholder="365"
                        class="config-input"
                      />
                      <select v-model="rule.periodUnit" class="config-select">
                        <option value="days">Dias</option>
                        <option value="weeks">Semanas</option>
                        <option value="months">Meses</option>
                        <option value="years">Anos</option>
                      </select>
                    </div>
                  </div>

                  <div v-else class="general-rule-config">
                    <div class="config-grid">
                      <div class="config-item">
                        <label class="config-label">Indicador</label>
                        <select v-model="rule.indicator" class="config-select">
                          <option value="">Selecione</option>
                          <option v-for="indicator in getIndicatorsByType(rule.type)" :key="indicator.value" :value="indicator.value">
                            {{ indicator.label }}
                          </option>
                        </select>
                      </div>

                      <div class="config-item">
                        <label class="config-label">Condição</label>
                        <select v-model="rule.condition" class="config-select">
                          <option value="">Selecione</option>
                          <option value="gt">Maior que</option>
                          <option value="lt">Menor que</option>
                          <option value="eq">Igual a</option>
                          <option value="gte">Maior ou igual</option>
                          <option value="lte">Menor ou igual</option>
                          <option value="cross_above">Cruza acima</option>
                          <option value="cross_below">Cruza abaixo</option>
                        </select>
                      </div>

                      <div class="config-item">
                        <label class="config-label">Valor</label>
                        <input 
                          v-model="rule.value"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          class="config-input"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="rule-description">
                    <label class="config-label">Descrição da Regra</label>
                    <input 
                      v-model="rule.description"
                      type="text"
                      placeholder="Ex: Vender com 20% de lucro"
                      class="config-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button @click="addRule('exit')" class="add-rule-btn">
              + Adicionar Regra de Saída
            </button>

            <!-- Lógica entre Regras -->
            <div v-if="methodology.exitRules.length > 1" class="rules-logic">
              <h4 class="logic-title">Lógica entre Regras</h4>
              <div class="logic-options">
                <label class="logic-option">
                  <input 
                    v-model="methodology.exitLogic"
                    value="and"
                    type="radio"
                    class="logic-radio"
                  />
                  <span class="logic-label">E (AND) - Todas as regras devem ser atendidas</span>
                </label>
                <label class="logic-option">
                  <input 
                    v-model="methodology.exitLogic"
                    value="or"
                    type="radio"
                    class="logic-radio"
                  />
                  <span class="logic-label">OU (OR) - Pelo menos uma regra deve ser atendida</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 5: Gestão de Risco -->
        <div v-if="currentStep === 4" class="step-content">
          <h3 class="step-heading">Gestão de Risco e Portfolio</h3>
          
          <div class="risk-management">
            <div class="risk-section">
              <h4 class="section-title">Alocação de Capital</h4>
              <div class="allocation-config">
                <div class="config-row">
                  <label class="config-label">Máximo por Posição (%)</label>
                  <input 
                    v-model="methodology.riskManagement.maxPositionSize"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    placeholder="10"
                    class="config-input"
                  />
                </div>

                <div class="config-row">
                  <label class="config-label">Número Máximo de Posições</label>
                  <input 
                    v-model="methodology.riskManagement.maxPositions"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    placeholder="20"
                    class="config-input"
                  />
                </div>

                <div class="config-row">
                  <label class="config-label">Concentração Máxima por Setor (%)</label>
                  <input 
                    v-model="methodology.riskManagement.maxSectorConcentration"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    placeholder="30"
                    class="config-input"
                  />
                </div>
              </div>
            </div>

            <div class="risk-section">
              <h4 class="section-title">Controle de Risco</h4>
              <div class="risk-controls">
                <div class="control-item">
                  <label class="control-label">
                    <input 
                      v-model="methodology.riskManagement.useStopLoss"
                      type="checkbox"
                      class="control-checkbox"
                    />
                    <span class="control-text">Usar Stop Loss Global</span>
                  </label>
                  <div v-if="methodology.riskManagement.useStopLoss" class="control-config">
                    <input 
                      v-model="methodology.riskManagement.globalStopLoss"
                      type="number"
                      min="1"
                      max="50"
                      step="1"
                      placeholder="15"
                      class="config-input"
                    />
                    <span class="input-suffix">%</span>
                  </div>
                </div>

                <div class="control-item">
                  <label class="control-label">
                    <input 
                      v-model="methodology.riskManagement.useTrailingStop"
                      type="checkbox"
                      class="control-checkbox"
                    />
                    <span class="control-text">Usar Trailing Stop</span>
                  </label>
                  <div v-if="methodology.riskManagement.useTrailingStop" class="control-config">
                    <input 
                      v-model="methodology.riskManagement.trailingStopDistance"
                      type="number"
                      min="1"
                      max="30"
                      step="1"
                      placeholder="10"
                      class="config-input"
                    />
                    <span class="input-suffix">%</span>
                  </div>
                </div>

                <div class="control-item">
                  <label class="control-label">
                    <input 
                      v-model="methodology.riskManagement.useVolatilityFilter"
                      type="checkbox"
                      class="control-checkbox"
                    />
                    <span class="control-text">Filtro de Volatilidade</span>
                  </label>
                  <div v-if="methodology.riskManagement.useVolatilityFilter" class="control-config">
                    <input 
                      v-model="methodology.riskManagement.maxVolatility"
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      placeholder="30"
                      class="config-input"
                    />
                    <span class="input-suffix">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="risk-section">
              <h4 class="section-title">Rebalanceamento</h4>
              <div class="rebalance-config">
                <div class="config-row">
                  <label class="config-label">Frequência de Rebalanceamento</label>
                  <select v-model="methodology.riskManagement.rebalanceFrequency" class="config-select">
                    <option value="never">Nunca</option>
                    <option value="monthly">Mensal</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="semiannual">Semestral</option>
                    <option value="annual">Anual</option>
                    <option value="threshold">Por Limite de Desvio</option>
                  </select>
                </div>

                <div v-if="methodology.riskManagement.rebalanceFrequency === 'threshold'" class="config-row">
                  <label class="config-label">Limite de Desvio (%)</label>
                  <input 
                    v-model="methodology.riskManagement.rebalanceThreshold"
                    type="number"
                    min="1"
                    max="50"
                    step="1"
                    placeholder="20"
                    class="config-input"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Step 6: Revisão e Teste -->
        <div v-if="currentStep === 5" class="step-content">
          <h3 class="step-heading">Revisão e Teste da Metodologia</h3>
          
          <div class="methodology-review">
            <!-- Resumo da Metodologia -->
            <div class="review-section">
              <h4 class="section-title">Resumo da Metodologia</h4>
              <div class="methodology-summary">
                <div class="summary-card">
                  <div class="summary-header">
                    <h5 class="summary-name">{{ methodology.name }}</h5>
                    <span class="summary-category">{{ getCategoryLabel(methodology.category) }}</span>
                  </div>
                  <p class="summary-description">{{ methodology.description }}</p>
                  <div class="summary-details">
                    <div class="detail-item">
                      <span class="detail-label">Perfil de Risco:</span>
                      <span class="detail-value">{{ getRiskProfileLabel(methodology.riskProfile) }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Horizonte:</span>
                      <span class="detail-value">{{ getTimeHorizonLabel(methodology.timeHorizon) }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Critérios:</span>
                      <span class="detail-value">{{ methodology.criteria.length }} critérios</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Regras de Entrada:</span>
                      <span class="detail-value">{{ methodology.entryRules.length }} regras</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Regras de Saída:</span>
                      <span class="detail-value">{{ methodology.exitRules.length }} regras</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Validação da Metodologia -->
            <div class="review-section">
              <h4 class="section-title">Validação da Metodologia</h4>
              <div class="validation-results">
                <div 
                  v-for="validation in validationResults" 
                  :key="validation.id"
                  class="validation-item"
                  :class="validation.status"
                >
                  <div class="validation-icon">
                    <span v-if="validation.status === 'success'">✓</span>
                    <span v-else-if="validation.status === 'warning'">⚠</span>
                    <span v-else>✗</span>
                  </div>
                  <div class="validation-content">
                    <span class="validation-title">{{ validation.title }}</span>
                    <span class="validation-message">{{ validation.message }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Teste Rápido -->
            <div class="review-section">
              <h4 class="section-title">Teste Rápido</h4>
              <div class="quick-test">
                <p class="test-description">
                  Execute um teste rápido da sua metodologia com dados históricos dos últimos 2 anos.
                </p>
                <button 
                  @click="runQuickTest"
                  :disabled="isTestRunning || !isMethodologyValid"
                  class="test-btn"
                >
                  {{ isTestRunning ? 'Executando Teste...' : 'Executar Teste Rápido' }}
                </button>

                <!-- Resultados do Teste -->
                <div v-if="testResults" class="test-results">
                  <h5 class="results-title">Resultados do Teste (2 anos)</h5>
                  <div class="results-grid">
                    <div class="result-item">
                      <span class="result-label">Retorno Total</span>
                      <span class="result-value" :class="{ positive: testResults.totalReturn > 0, negative: testResults.totalReturn < 0 }">
                        {{ formatPercentage(testResults.totalReturn) }}
                      </span>
                    </div>
                    <div class="result-item">
                      <span class="result-label">Sharpe Ratio</span>
                      <span class="result-value">{{ formatNumber(testResults.sharpeRatio) }}</span>
                    </div>
                    <div class="result-item">
                      <span class="result-label">Max Drawdown</span>
                      <span class="result-value negative">{{ formatPercentage(testResults.maxDrawdown) }}</span>
                    </div>
                    <div class="result-item">
                      <span class="result-label">Trades</span>
                      <span class="result-value">{{ testResults.totalTrades }}</span>
                    </div>
                    <div class="result-item">
                      <span class="result-label">Taxa de Acerto</span>
                      <span class="result-value">{{ formatPercentage(testResults.winRate) }}</span>
                    </div>
                    <div class="result-item">
                      <span class="result-label">vs Ibovespa</span>
                      <span class="result-value" :class="{ positive: testResults.alpha > 0, negative: testResults.alpha < 0 }">
                        {{ formatPercentage(testResults.alpha) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Navegação do Wizard -->
      <div class="wizard-navigation">
        <button 
          @click="previousStep"
          :disabled="currentStep === 0"
          class="nav-btn prev-btn"
        >
          ← Anterior
        </button>

        <div class="step-indicator">
          {{ currentStep + 1 }} de {{ wizardSteps.length }}
        </div>

        <button 
          v-if="currentStep < wizardSteps.length - 1"
          @click="nextStep"
          :disabled="!canProceedToNextStep()"
          class="nav-btn next-btn"
        >
          Próximo →
        </button>

        <button 
          v-else
          @click="saveMethodology"
          :disabled="!isMethodologyValid"
          class="nav-btn save-btn"
        >
          Salvar Metodologia
        </button>
      </div>
    </div>

    <!-- Metodologias Salvas -->
    <div class="saved-methodologies">
      <h3 class="saved-title">Suas Metodologias Personalizadas</h3>
      <div class="methodologies-grid">
        <div 
          v-for="saved in savedMethodologies" 
          :key="saved.id"
          class="methodology-card"
        >
          <div class="card-header">
            <div class="card-info">
              <h4 class="card-name">{{ saved.name }}</h4>
              <p class="card-description">{{ saved.description }}</p>
            </div>
            <div class="card-status">
              <span class="status-badge" :class="saved.status">{{ getStatusLabel(saved.status) }}</span>
            </div>
          </div>

          <div class="card-metrics">
            <div class="metric-item">
              <span class="metric-label">Categoria</span>
              <span class="metric-value">{{ getCategoryLabel(saved.category) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Risco</span>
              <span class="metric-value">{{ getRiskProfileLabel(saved.riskProfile) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Performance</span>
              <span class="metric-value" :class="{ positive: saved.performance > 0, negative: saved.performance < 0 }">
                {{ formatPercentage(saved.performance) }}
              </span>
            </div>
          </div>

          <div class="card-actions">
            <button @click="editMethodology(saved)" class="action-btn edit">Editar</button>
            <button @click="cloneMethodology(saved)" class="action-btn clone">Clonar</button>
            <button @click="backtestMethodology(saved)" class="action-btn backtest">Backtest</button>
            <button @click="deleteMethodology(saved)" class="action-btn delete">Excluir</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'

export default {
  name: 'CustomMethodologyBuilder',
  setup() {
    const currentStep = ref(0)
    const isTestRunning = ref(false)
    const testResults = ref(null)
    const savedMethodologies = ref([])

    const methodology = reactive({
      name: '',
      category: '',
      description: '',
      riskProfile: '',
      timeHorizon: '',
      criteria: [],
      entryRules: [],
      exitRules: [],
      entryLogic: 'and',
      exitLogic: 'or',
      riskManagement: {
        maxPositionSize: 10,
        maxPositions: 20,
        maxSectorConcentration: 30,
        useStopLoss: false,
        globalStopLoss: 15,
        useTrailingStop: false,
        trailingStopDistance: 10,
        useVolatilityFilter: false,
        maxVolatility: 30,
        rebalanceFrequency: 'quarterly',
        rebalanceThreshold: 20
      }
    })

    const errors = reactive({})

    const wizardSteps = [
      {
        id: 'basic',
        title: 'Informações Básicas',
        description: 'Nome, categoria e perfil'
      },
      {
        id: 'criteria',
        title: 'Critérios de Seleção',
        description: 'Filtros fundamentalistas'
      },
      {
        id: 'entry',
        title: 'Regras de Entrada',
        description: 'Condições para compra'
      },
      {
        id: 'exit',
        title: 'Regras de Saída',
        description: 'Condições para venda'
      },
      {
        id: 'risk',
        title: 'Gestão de Risco',
        description: 'Controle de portfolio'
      },
      {
        id: 'review',
        title: 'Revisão e Teste',
        description: 'Validação final'
      }
    ]

    const riskProfiles = [
      {
        value: 'conservative',
        name: 'Conservador',
        description: 'Baixo risco, retornos estáveis',
        icon: '🛡️',
        color: '#10b981'
      },
      {
        value: 'moderate',
        name: 'Moderado',
        description: 'Risco equilibrado',
        icon: '⚖️',
        color: '#f59e0b'
      },
      {
        value: 'aggressive',
        name: 'Agressivo',
        description: 'Alto risco, alto retorno',
        icon: '🚀',
        color: '#ef4444'
      }
    ]

    const availableCriteria = [
      {
        id: 'pe_ratio',
        name: 'P/L (Price/Earnings)',
        description: 'Preço sobre Lucro',
        icon: '💰',
        operators: [
          { value: 'lt', label: 'Menor que' },
          { value: 'gt', label: 'Maior que' },
          { value: 'between', label: 'Entre' }
        ],
        inputType: 'number',
        placeholder: '15.0',
        hasWeight: true
      },
      {
        id: 'pb_ratio',
        name: 'P/VP (Price/Book)',
        description: 'Preço sobre Valor Patrimonial',
        icon: '📚',
        operators: [
          { value: 'lt', label: 'Menor que' },
          { value: 'gt', label: 'Maior que' },
          { value: 'between', label: 'Entre' }
        ],
        inputType: 'number',
        placeholder: '2.0',
        hasWeight: true
      },
      {
        id: 'roe',
        name: 'ROE (Return on Equity)',
        description: 'Retorno sobre Patrimônio',
        icon: '📈',
        operators: [
          { value: 'gt', label: 'Maior que' },
          { value: 'lt', label: 'Menor que' },
          { value: 'between', label: 'Entre' }
        ],
        inputType: 'number',
        placeholder: '15.0',
        hasWeight: true
      },
      {
        id: 'debt_equity',
        name: 'Dívida/Patrimônio',
        description: 'Nível de endividamento',
        icon: '⚖️',
        operators: [
          { value: 'lt', label: 'Menor que' },
          { value: 'gt', label: 'Maior que' }
        ],
        inputType: 'number',
        placeholder: '0.5',
        hasWeight: true
      },
      {
        id: 'dividend_yield',
        name: 'Dividend Yield',
        description: 'Rendimento de dividendos',
        icon: '💎',
        operators: [
          { value: 'gt', label: 'Maior que' },
          { value: 'between', label: 'Entre' }
        ],
        inputType: 'number',
        placeholder: '5.0',
        hasWeight: true
      },
      {
        id: 'market_cap',
        name: 'Capitalização de Mercado',
        description: 'Tamanho da empresa',
        icon: '🏢',
        operators: [
          { value: 'gt', label: 'Maior que' },
          { value: 'lt', label: 'Menor que' },
          { value: 'between', label: 'Entre' }
        ],
        inputType: 'number',
        placeholder: '1000000000',
        hasWeight: false
      }
    ]

    const validationResults = computed(() => {
      const results = []

      // Validar informações básicas
      if (methodology.name && methodology.category && methodology.description) {
        results.push({
          id: 'basic_info',
          status: 'success',
          title: 'Informações Básicas',
          message: 'Todas as informações básicas foram preenchidas'
        })
      } else {
        results.push({
          id: 'basic_info',
          status: 'error',
          title: 'Informações Básicas',
          message: 'Preencha todas as informações básicas'
        })
      }

      // Validar critérios
      if (methodology.criteria.length > 0) {
        results.push({
          id: 'criteria',
          status: 'success',
          title: 'Critérios de Seleção',
          message: `${methodology.criteria.length} critérios definidos`
        })
      } else {
        results.push({
          id: 'criteria',
          status: 'warning',
          title: 'Critérios de Seleção',
          message: 'Nenhum critério definido - todos os ativos serão considerados'
        })
      }

      // Validar regras de entrada
      if (methodology.entryRules.length > 0) {
        results.push({
          id: 'entry_rules',
          status: 'success',
          title: 'Regras de Entrada',
          message: `${methodology.entryRules.length} regras de entrada definidas`
        })
      } else {
        results.push({
          id: 'entry_rules',
          status: 'error',
          title: 'Regras de Entrada',
          message: 'Defina pelo menos uma regra de entrada'
        })
      }

      // Validar regras de saída
      if (methodology.exitRules.length > 0) {
        results.push({
          id: 'exit_rules',
          status: 'success',
          title: 'Regras de Saída',
          message: `${methodology.exitRules.length} regras de saída definidas`
        })
      } else {
        results.push({
          id: 'exit_rules',
          status: 'warning',
          title: 'Regras de Saída',
          message: 'Nenhuma regra de saída - posições podem ficar abertas indefinidamente'
        })
      }

      return results
    })

    const isMethodologyValid = computed(() => {
      return methodology.name && 
             methodology.category && 
             methodology.description && 
             methodology.entryRules.length > 0
    })

    // Methods
    const goToStep = (step) => {
      if (step <= currentStep.value || canProceedToStep(step)) {
        currentStep.value = step
      }
    }

    const canProceedToStep = (step) => {
      // Implementar validação específica para cada step
      return true
    }

    const canProceedToNextStep = () => {
      switch (currentStep.value) {
        case 0:
          return methodology.name && methodology.category && methodology.description && methodology.riskProfile && methodology.timeHorizon
        case 1:
          return true // Critérios são opcionais
        case 2:
          return methodology.entryRules.length > 0
        case 3:
          return true // Regras de saída são opcionais
        case 4:
          return true // Gestão de risco tem valores padrão
        case 5:
          return isMethodologyValid.value
        default:
          return false
      }
    }

    const nextStep = () => {
      if (currentStep.value < wizardSteps.length - 1 && canProceedToNextStep()) {
        currentStep.value++
      }
    }

    const previousStep = () => {
      if (currentStep.value > 0) {
        currentStep.value--
      }
    }

    const validateStep = () => {
      // Limpar erros anteriores
      Object.keys(errors).forEach(key => {
        delete errors[key]
      })

      // Validar step atual
      if (currentStep.value === 0) {
        if (!methodology.name) {
          errors.name = 'Nome é obrigatório'
        }
        if (!methodology.category) {
          errors.category = 'Categoria é obrigatória'
        }
        if (!methodology.description) {
          errors.description = 'Descrição é obrigatória'
        }
        if (!methodology.riskProfile) {
          errors.riskProfile = 'Perfil de risco é obrigatório'
        }
        if (!methodology.timeHorizon) {
          errors.timeHorizon = 'Horizonte de investimento é obrigatório'
        }
      }
    }

    const isCriterionActive = (criterionId) => {
      return methodology.criteria.some(c => c.id === criterionId)
    }

    const toggleCriterion = (criterion) => {
      const index = methodology.criteria.findIndex(c => c.id === criterion.id)
      if (index > -1) {
        methodology.criteria.splice(index, 1)
      } else {
        methodology.criteria.push({
          id: criterion.id,
          operator: criterion.operators[0].value,
          value: '',
          weight: criterion.hasWeight ? 50 : undefined
        })
      }
    }

    const getCriterionConfig = (criterionId) => {
      return methodology.criteria.find(c => c.id === criterionId) || {}
    }

    const getCriterionName = (criterionId) => {
      const criterion = availableCriteria.find(c => c.id === criterionId)
      return criterion ? criterion.name : ''
    }

    const getOperatorLabel = (criterionId, operator) => {
      const criterion = availableCriteria.find(c => c.id === criterionId)
      if (!criterion) return ''
      const op = criterion.operators.find(o => o.value === operator)
      return op ? op.label : ''
    }

    const addRule = (type) => {
      const newRule = {
        type: '',
        indicator: '',
        condition: '',
        value: '',
        description: ''
      }

      if (type === 'entry') {
        methodology.entryRules.push(newRule)
      } else {
        methodology.exitRules.push(newRule)
      }
    }

    const removeRule = (type, index) => {
      if (type === 'entry') {
        methodology.entryRules.splice(index, 1)
      } else {
        methodology.exitRules.splice(index, 1)
      }
    }

    const getIndicatorsByType = (type) => {
      const indicators = {
        price: [
          { value: 'close_price', label: 'Preço de Fechamento' },
          { value: 'high_price', label: 'Preço Máximo' },
          { value: 'low_price', label: 'Preço Mínimo' }
        ],
        technical: [
          { value: 'sma_20', label: 'Média Móvel 20' },
          { value: 'sma_50', label: 'Média Móvel 50' },
          { value: 'rsi', label: 'RSI' },
          { value: 'macd', label: 'MACD' },
          { value: 'bollinger_upper', label: 'Banda Superior Bollinger' },
          { value: 'bollinger_lower', label: 'Banda Inferior Bollinger' }
        ],
        fundamental: [
          { value: 'pe_ratio', label: 'P/L' },
          { value: 'pb_ratio', label: 'P/VP' },
          { value: 'roe', label: 'ROE' },
          { value: 'debt_equity', label: 'Dívida/Patrimônio' },
          { value: 'dividend_yield', label: 'Dividend Yield' }
        ],
        market: [
          { value: 'market_trend', label: 'Tendência do Mercado' },
          { value: 'sector_performance', label: 'Performance do Setor' },
          { value: 'volatility_index', label: 'Índice de Volatilidade' }
        ],
        time: [
          { value: 'day_of_week', label: 'Dia da Semana' },
          { value: 'month', label: 'Mês' },
          { value: 'quarter', label: 'Trimestre' }
        ]
      }

      return indicators[type] || []
    }

    const runQuickTest = async () => {
      isTestRunning.value = true
      
      // Simular teste
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Gerar resultados simulados
      testResults.value = {
        totalReturn: 0.1847 + (Math.random() - 0.5) * 0.4,
        sharpeRatio: 1.2 + (Math.random() - 0.5) * 0.8,
        maxDrawdown: -0.15 - Math.random() * 0.1,
        totalTrades: Math.floor(50 + Math.random() * 100),
        winRate: 0.55 + (Math.random() - 0.5) * 0.2,
        alpha: 0.05 + (Math.random() - 0.5) * 0.1
      }
      
      isTestRunning.value = false
    }

    const saveMethodology = () => {
      const newMethodology = {
        id: Date.now(),
        ...methodology,
        status: 'active',
        performance: testResults.value ? testResults.value.totalReturn : 0,
        createdAt: new Date()
      }

      savedMethodologies.value.push(newMethodology)
      
      // Reset form
      Object.keys(methodology).forEach(key => {
        if (typeof methodology[key] === 'string') {
          methodology[key] = ''
        } else if (Array.isArray(methodology[key])) {
          methodology[key] = []
        }
      })
      
      currentStep.value = 0
      testResults.value = null
      
      alert('Metodologia salva com sucesso!')
    }

    const editMethodology = (saved) => {
      Object.assign(methodology, saved)
      currentStep.value = 0
    }

    const cloneMethodology = (saved) => {
      Object.assign(methodology, {
        ...saved,
        name: `${saved.name} (Cópia)`,
        id: undefined
      })
      currentStep.value = 0
    }

    const backtestMethodology = (saved) => {
      // Navegar para componente de backtesting
      alert(`Iniciando backtest para: ${saved.name}`)
    }

    const deleteMethodology = (saved) => {
      if (confirm(`Deseja excluir a metodologia "${saved.name}"?`)) {
        const index = savedMethodologies.value.findIndex(m => m.id === saved.id)
        if (index > -1) {
          savedMethodologies.value.splice(index, 1)
        }
      }
    }

    // Utility functions
    const getCategoryLabel = (category) => {
      const categories = {
        value: 'Value Investing',
        growth: 'Growth Investing',
        dividend: 'Dividend Investing',
        momentum: 'Momentum',
        contrarian: 'Contrarian',
        quality: 'Quality',
        hybrid: 'Híbrida'
      }
      return categories[category] || category
    }

    const getRiskProfileLabel = (profile) => {
      const profiles = {
        conservative: 'Conservador',
        moderate: 'Moderado',
        aggressive: 'Agressivo'
      }
      return profiles[profile] || profile
    }

    const getTimeHorizonLabel = (horizon) => {
      const horizons = {
        short: 'Curto Prazo',
        medium: 'Médio Prazo',
        long: 'Longo Prazo'
      }
      return horizons[horizon] || horizon
    }

    const getStatusLabel = (status) => {
      const statuses = {
        active: 'Ativa',
        paused: 'Pausada',
        testing: 'Em Teste'
      }
      return statuses[status] || status
    }

    const formatPercentage = (value) => {
      return `${(value * 100).toFixed(2)}%`
    }

    const formatNumber = (value) => {
      return value.toFixed(2)
    }

    onMounted(() => {
      // Carregar metodologias salvas
      loadSavedMethodologies()
    })

    const loadSavedMethodologies = () => {
      // Simular carregamento de metodologias salvas
      savedMethodologies.value = [
        {
          id: 1,
          name: 'Value Conservador',
          category: 'value',
          description: 'Estratégia focada em ações baratas com baixo risco',
          riskProfile: 'conservative',
          status: 'active',
          performance: 0.1234,
          createdAt: new Date('2024-11-15')
        },
        {
          id: 2,
          name: 'Growth Agressivo',
          category: 'growth',
          description: 'Estratégia de crescimento com alto potencial',
          riskProfile: 'aggressive',
          status: 'testing',
          performance: 0.2847,
          createdAt: new Date('2024-12-01')
        }
      ]
    }

    return {
      currentStep,
      isTestRunning,
      testResults,
      savedMethodologies,
      methodology,
      errors,
      wizardSteps,
      riskProfiles,
      availableCriteria,
      validationResults,
      isMethodologyValid,
      goToStep,
      canProceedToNextStep,
      nextStep,
      previousStep,
      validateStep,
      isCriterionActive,
      toggleCriterion,
      getCriterionConfig,
      getCriterionName,
      getOperatorLabel,
      addRule,
      removeRule,
      getIndicatorsByType,
      runQuickTest,
      saveMethodology,
      editMethodology,
      cloneMethodology,
      backtestMethodology,
      deleteMethodology,
      getCategoryLabel,
      getRiskProfileLabel,
      getTimeHorizonLabel,
      getStatusLabel,
      formatPercentage,
      formatNumber
    }
  }
}
</script>

<style scoped>
.methodology-builder {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.builder-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 40px;
  text-align: center;
}

.header-title {
  font-size: 2rem;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.header-subtitle {
  font-size: 1.125rem;
  opacity: 0.9;
  margin: 0;
}

.builder-wizard {
  padding: 32px 40px;
}

.wizard-steps {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
  position: relative;
}

.wizard-steps::before {
  content: '';
  position: absolute;
  top: 20px;
  left: 40px;
  right: 40px;
  height: 2px;
  background: #e5e7eb;
  z-index: 1;
}

.wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  position: relative;
  z-index: 2;
  flex: 1;
  max-width: 150px;
}

.wizard-step.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #e5e7eb;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.wizard-step.active .step-number {
  background: #667eea;
  color: white;
}

.wizard-step.completed .step-number {
  background: #10b981;
  color: white;
}

.step-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  text-align: center;
}

.step-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.step-description {
  font-size: 0.75rem;
  color: #6b7280;
}

.wizard-content {
  min-height: 500px;
}

.step-content {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.step-heading {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 24px 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
}

.form-input,
.form-select,
.form-textarea {
  padding: 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
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

.error-message {
  font-size: 0.875rem;
  color: #ef4444;
}

.risk-selector {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.risk-option:hover {
  border-color: #667eea;
}

.risk-option.selected {
  border-color: #667eea;
  background: #f0f9ff;
}

.risk-radio {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
}

.risk-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.risk-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: white;
}

.risk-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.risk-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.risk-description {
  font-size: 0.875rem;
  color: #6b7280;
}

.criteria-builder {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.criteria-header {
  text-align: center;
}

.criteria-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.criteria-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.criteria-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 16px;
}

.criterion-card {
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s;
}

.criterion-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
}

.criterion-card.active {
  border-color: #667eea;
  background: #f0f9ff;
}

.criterion-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.criterion-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.criterion-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.criterion-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.criterion-description {
  font-size: 0.875rem;
  color: #6b7280;
}

.criterion-toggle {
  flex-shrink: 0;
}

.toggle-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #667eea;
}

.criterion-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.config-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  min-width: 80px;
}

.config-select,
.config-input {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  flex: 1;
}

.config-range {
  flex: 1;
  accent-color: #667eea;
}

.criteria-summary {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.summary-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: white;
  border-radius: 4px;
}

.summary-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.summary-condition {
  font-size: 0.875rem;
  color: #6b7280;
}

.summary-weight {
  font-size: 0.75rem;
  color: #667eea;
  font-weight: 500;
}

.rules-builder {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.rules-header {
  text-align: center;
}

.rules-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 8px 0;
}

.rules-subtitle {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.rule-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.rule-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #667eea;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.rule-select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  flex: 1;
}

.remove-rule-btn {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.rule-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-description {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.add-rule-btn {
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  align-self: flex-start;
  transition: background 0.2s;
}

.add-rule-btn:hover {
  background: #059669;
}

.rules-logic {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
}

.logic-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 12px 0;
}

.logic-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.logic-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.logic-radio {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
}

.logic-label {
  font-size: 0.875rem;
  color: #374151;
}

.profit-target-config,
.stop-loss-config,
.time-exit-config,
.general-rule-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-management {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.risk-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.allocation-config,
.rebalance-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.control-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.control-checkbox {
  width: 16px;
  height: 16px;
  accent-color: #667eea;
}

.control-text {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.control-config {
  display: flex;
  align-items: center;
  gap: 4px;
}

.input-suffix {
  font-size: 0.875rem;
  color: #6b7280;
}

.methodology-review {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.review-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.methodology-summary {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
}

.summary-card {
  background: white;
  border-radius: 6px;
  padding: 20px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.summary-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.summary-category {
  background: #667eea;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.summary-description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.summary-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
}

.validation-results {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.validation-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 6px;
}

.validation-item.success {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
}

.validation-item.warning {
  background: #fef3c7;
  border: 1px solid #fde68a;
}

.validation-item.error {
  background: #fee2e2;
  border: 1px solid #fecaca;
}

.validation-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.validation-item.success .validation-icon {
  background: #10b981;
  color: white;
}

.validation-item.warning .validation-icon {
  background: #f59e0b;
  color: white;
}

.validation-item.error .validation-icon {
  background: #ef4444;
  color: white;
}

.validation-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.validation-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
}

.validation-message {
  font-size: 0.875rem;
  color: #6b7280;
}

.quick-test {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.test-description {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 16px 0;
}

.test-btn {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.test-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.test-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-results {
  margin-top: 24px;
  text-align: left;
}

.results-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 16px 0;
}

.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  text-align: center;
}

.result-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

.result-value {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
}

.result-value.positive {
  color: #10b981;
}

.result-value.negative {
  color: #ef4444;
}

.wizard-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 40px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.nav-btn {
  padding: 12px 24px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.prev-btn {
  background: transparent;
  color: #6b7280;
  border: 1px solid #d1d5db;
}

.prev-btn:hover:not(:disabled) {
  background: #f3f4f6;
  color: #374151;
}

.next-btn {
  background: #667eea;
  color: white;
}

.next-btn:hover:not(:disabled) {
  background: #5a67d8;
}

.save-btn {
  background: #10b981;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #059669;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-indicator {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.saved-methodologies {
  padding: 32px 40px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

.saved-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 24px 0;
}

.methodologies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.methodology-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.2s;
}

.methodology-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.card-info {
  flex: 1;
}

.card-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 4px 0;
}

.card-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.card-status {
  flex-shrink: 0;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.active {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.paused {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.testing {
  background: #dbeafe;
  color: #1e40af;
}

.card-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  text-align: center;
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

.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: transparent;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #6b7280;
  padding: 6px 12px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
}

.action-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.action-btn.edit:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.action-btn.clone:hover {
  border-color: #10b981;
  color: #10b981;
}

.action-btn.backtest:hover {
  border-color: #667eea;
  color: #667eea;
}

.action-btn.delete:hover {
  border-color: #ef4444;
  color: #ef4444;
}

/* Responsividade */
@media (max-width: 768px) {
  .builder-header,
  .builder-wizard,
  .wizard-navigation,
  .saved-methodologies {
    padding: 20px;
  }

  .wizard-steps {
    flex-direction: column;
    gap: 16px;
  }

  .wizard-steps::before {
    display: none;
  }

  .wizard-step {
    flex-direction: row;
    max-width: none;
    text-align: left;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .criteria-grid {
    grid-template-columns: 1fr;
  }

  .config-grid {
    grid-template-columns: 1fr;
  }

  .summary-details {
    grid-template-columns: 1fr;
  }

  .results-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .wizard-navigation {
    flex-direction: column;
    gap: 12px;
  }

  .nav-btn {
    width: 100%;
  }

  .methodologies-grid {
    grid-template-columns: 1fr;
  }

  .card-metrics {
    grid-template-columns: 1fr;
  }

  .card-actions {
    flex-direction: column;
  }
}
</style>

