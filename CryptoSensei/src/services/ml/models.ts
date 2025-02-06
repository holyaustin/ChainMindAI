import * as tf from '@tensorflow/tfjs';

export class MLModels {
  private trendModel: tf.LayersModel | null = null;
  private priceModel: tf.LayersModel | null = null;
  private levelModel: tf.LayersModel | null = null;

  async getTrendModel() {
    if (!this.trendModel) {
      this.trendModel = await this.createTrendModel();
    }
    return this.trendModel;
  }

  async getPriceModel() {
    if (!this.priceModel) {
      this.priceModel = await this.createPriceModel();
    }
    return this.priceModel;
  }

  async getLevelModel() {
    if (!this.levelModel) {
      this.levelModel = await this.createLevelModel();
    }
    return this.levelModel;
  }

  private async createTrendModel() {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
      inputShape: [4]
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    model.add(tf.layers.dense({
      units: 16,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 1,
      activation: 'tanh'
    }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });
    
    return model;
  }

  private async createPriceModel() {
    const model = tf.sequential();
    
    model.add(tf.layers.lstm({
      units: 100,
      returnSequences: true,
      inputShape: [20, 6]
    }));
    
    model.add(tf.layers.dropout({ rate: 0.2 }));
    
    model.add(tf.layers.lstm({
      units: 50,
      returnSequences: false
    }));
    
    model.add(tf.layers.dense({
      units: 25,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 2
    }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });
    
    return model;
  }

  private async createLevelModel() {
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [20]
    }));
    
    model.add(tf.layers.dropout({ rate: 0.3 }));
    
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu'
    }));
    
    model.add(tf.layers.dense({
      units: 4
    }));
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError'
    });
    
    return model;
  }
}

export const mlModels = new MLModels(); 