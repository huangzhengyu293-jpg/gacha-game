'use client';
import React, { useEffect, useRef } from 'react';

interface CardData {
  id: string;
  name: string;
  image: string;
  price: number;
  rarity: string;
  itemId?: string;
  itemName?: string;
  itemImage?: string;
  itemPrice?: number;
  itemRarity?: string;
}

interface SlotMachineProps {
  onResult?: (card: CardData) => void;
  onSpinStart?: () => void;
  onSpinEnd?: () => void;
  showControls?: boolean;
  showResult?: boolean;
}

const SlotMachine: React.FC<SlotMachineProps> = ({
  onResult,
  onSpinStart,
  onSpinEnd,
  showControls = true,
  showResult = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isSpinningRef = useRef(false);
  const targetCardRef = useRef<CardData | null>(null);
  const fixedDistanceRef = useRef(0);

  useEffect(() => {
    // 卡池配置
    const pokemonCards: CardData[] = [
      {
        "id": "item_halloween_1",
        "name": "仙子伊布 VMAX",
        "image": "https://ik.imagekit.io/hr727kunx/products/cmgo63gcm0000jv0o6zaqs5r6_1619359__y4fUlAB4d?tr=w-3840,c-at_max",
        "price": 735,
        "rarity": "legendary"
      },
      {
        "id": "item_halloween_2",
        "name": "火箭队的超梦前任",
        "image": "https://ik.imagekit.io/hr727kunx/products/cmgo61xkx0000ji0kjhlgt21k_9559845__y63lUSfM1?tr=w-3840,c-at_max",
        "price": 685,
        "rarity": "legendary"
      },
      {
        "id": "item_halloween_3",
        "name": "Zekrom ex",
        "image": "https://ik.imagekit.io/hr727kunx/products/cmgo606hm0000js0fxce2d3ko_3968236__47zGSrIT3?tr=w-3840,c-at_max",
        "price": 588,
        "rarity": "epic"
      },
      {
        "id": "item_halloween_4",
        "name": "喷火龙ex",
        "image": "https://ik.imagekit.io/hr727kunx/products/cmgo5ygl90000kz0m76trkyx0_967943__-Wz4IAmFp?tr=w-3840,c-at_max",
        "price": 385,
        "rarity": "epic"
      },
      {
        "id": "item_halloween_5",
        "name": "喷火龙ex",
        "image": "https://ik.imagekit.io/hr727kunx/products/cmg8qwvr20000kv0f7xwnyvu9_1596630__cqx8MRYg1?tr=w-3840,c-at_max",
        "price": 370,
        "rarity": "epic"
      },
      {
        "id": "item_halloween_6",
        "name": "Zekrom ex",
        "image": "https://ik.imagekit.io/hr727kunx/products/cmgo5of0l0000js0mqdkst7ia_3091949__o_1YBmAkO?tr=w-3840,c-at_max",
        "price": 335,
        "rarity": "rare"
      },
      {
        "id": "item_halloween_7",
        "name": "雷希拉姆",
        "image": "https://ik.imagekit.io/hr727kunx/products/cmgo5ksdb0000la0m1ovx7yas_2617810___ucaUkELf?tr=w-3840,c-at_max",
        "price": 255,
        "rarity": "rare"
      },
      {
        "id": "item_halloween_8",
        "name": "盖诺赛克特",
        "image": "https://ik.imagekit.io/hr727kunx/products/cmgo5hzna0000jz0f4bs1e3a5_1525619__Csxm8ivwb?tr=w-3840,c-at_max",
        "price": 79,
        "rarity": "uncommon"
      },
      {
        "id": "item_halloween_9",
        "name": "梅迪查姆五世",
        "image": "https://ik.imagekit.io/hr727kunx/products/cmgo2qell0001i50haz4762if_4053677__c3NUX4VJv?tr=w-3840,c-at_max",
        "price": 31,
        "rarity": "common"
      },
      {
        "id": "item_halloween_10",
        "name": "烛光五世",
        "image": "https://ik.imagekit.io/hr727kunx/products/cmgo2lik80000i50hy2hsb2qa_8750657__9B1p0b16?tr=w-3840,c-at_max",
        "price": 2.59,
        "rarity": "common"
      },
      {
        "id": "item_halloween_11",
        "name": "螃蟹V",
        "image": "https://ik.imagekit.io/hr727kunx/products/cmgo2hrjf0000kv0fqj7vt6yb_8772392__iqnuqYLx7?tr=w-3840,c-at_max",
        "price": 1.84,
        "rarity": "common"
      }
    ];

    // 全局变量
    const itemsPerReel = 30;
    const itemWidth = 200;
    const repeatTimes = 3;

    // 模拟后端API调用
    async function callBackendAPI(): Promise<{ success: boolean; data: CardData }> {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const random = Math.random();
      let selectedCard: CardData;
      
      if (random < 0.02) {
        const legendaries = pokemonCards.filter(c => c.rarity === 'legendary');
        selectedCard = legendaries[Math.floor(Math.random() * legendaries.length)];
      } else if (random < 0.10) {
        const epics = pokemonCards.filter(c => c.rarity === 'epic');
        selectedCard = epics[Math.floor(Math.random() * epics.length)];
      } else if (random < 0.30) {
        const rares = pokemonCards.filter(c => c.rarity === 'rare');
        selectedCard = rares[Math.floor(Math.random() * rares.length)];
      } else if (random < 0.60) {
        const uncommons = pokemonCards.filter(c => c.rarity === 'uncommon');
        selectedCard = uncommons[Math.floor(Math.random() * uncommons.length)];
      } else {
        const commons = pokemonCards.filter(c => c.rarity === 'common');
        selectedCard = commons[Math.floor(Math.random() * commons.length)];
      }
      
      return {
        success: true,
        data: {
          ...selectedCard,
          itemId: selectedCard.id,
          itemName: selectedCard.name,
          itemImage: selectedCard.image,
          itemPrice: selectedCard.price,
          itemRarity: selectedCard.rarity
        }
      };
    }

    // 创建单个item元素
    function createItemElement(card: CardData): HTMLDivElement {
      const item = document.createElement('div');
      item.className = 'slot-item';
      item.dataset.cardId = card.id || card.itemId;
      item.dataset.cardName = card.name || card.itemName;
      item.dataset.cardPrice = String(card.price || card.itemPrice);
      item.dataset.cardRarity = card.rarity || card.itemRarity;
      
      item.innerHTML = `
        <div class="slot-item-blur"></div>
        <div class="slot-item-image-wrapper">
          <img src="${card.image || card.itemImage}" 
               alt="${card.name || card.itemName}" 
               loading="lazy" 
               decoding="async" />
        </div>
        <div class="slot-item-info">
          <p>${card.name || card.itemName}</p>
          <p>$${card.price || card.itemPrice}</p>
        </div>
      `;
      
      return item;
    }

    // 初始化卷轴
    function initReel(): void {
      const container = containerRef.current;
      if (!container) return;
      
      container.innerHTML = '';
      
      const cardSequence: CardData[] = [];
      for (let j = 0; j < itemsPerReel; j++) {
        cardSequence.push(pokemonCards[Math.floor(Math.random() * pokemonCards.length)]);
      }
      
      for (let repeat = 0; repeat < repeatTimes; repeat++) {
        cardSequence.forEach(card => {
          const item = createItemElement(card);
          container.appendChild(item);
        });
      }
      
      const viewportCenter = window.innerWidth / 2;
      const startPosition = viewportCenter - (itemsPerReel * itemWidth) - 100;
      container.style.left = startPosition + 'px';
    }

    // 准备卷轴并计算固定距离
    function prepareReelWithTarget(targetCard: CardData): void {
      const container = containerRef.current;
      if (!container) return;
      
      const startLeft = parseFloat(container.style.left || '0');
      
      fixedDistanceRef.current = (Math.random() * 5 + 25) * itemWidth;
      
      const afterPhase1Left = startLeft - fixedDistanceRef.current;
      
      const viewportCenter = window.innerWidth / 2;
      const items = container.querySelectorAll('.slot-item');
      
      let closestIndex = 0;
      let minDistance = Infinity;
      
      let predictedLeft = afterPhase1Left;
      const totalWidth = itemsPerReel * itemWidth;
      const minLeft = viewportCenter - totalWidth * 2;
      const resetLeft = viewportCenter - totalWidth;
      
      if (predictedLeft <= minLeft) {
        const offset = predictedLeft - minLeft;
        predictedLeft = resetLeft + offset;
      }
      
      items.forEach((item, index) => {
        const itemLeft = index * itemWidth + predictedLeft;
        const itemCenter = itemLeft + itemWidth / 2;
        const distance = Math.abs(itemCenter - viewportCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });
      
      const oldItem = items[closestIndex];
      const newItem = createItemElement(targetCard);
      oldItem.parentNode?.replaceChild(newItem, oldItem);
    }

    // 原版缓动函数
    function customEase(t: number): number {
      if (t < 0.2) {
        return t * t * 12.5;
      } else {
        const t2 = (t - 0.2) / 0.8;
        return 0.5 + 0.5 * (1 - Math.pow(1 - t2, 5));
      }
    }

    // 检查并重置位置
    function checkAndResetPosition(container: HTMLDivElement): number {
      let currentLeft = parseFloat(container.style.left);
      const totalWidth = itemsPerReel * itemWidth;
      const viewportCenter = window.innerWidth / 2;
      const minLeft = viewportCenter - totalWidth * 2;
      const resetLeft = viewportCenter - totalWidth;
      
      if (currentLeft <= minLeft) {
        const offset = currentLeft - minLeft;
        currentLeft = resetLeft + offset;
        container.style.left = currentLeft + 'px';
      }
      return currentLeft;
    }

    // 更新选中状态
    function updateSelection(showInfo = false): void {
      const container = containerRef.current;
      if (!container) return;
      
      const items = container.querySelectorAll('.slot-item');
      const viewportCenter = window.innerWidth / 2;
      const containerLeft = checkAndResetPosition(container);
      
      items.forEach((item, index) => {
        const itemLeft = index * itemWidth + containerLeft;
        const itemCenter = itemLeft + itemWidth / 2;
        const distance = Math.abs(itemCenter - viewportCenter);
        
        if (distance < itemWidth / 2) {
          item.classList.add('selected');
          if (showInfo) {
            item.classList.add('show-info');
          }
        } else {
          item.classList.remove('selected', 'show-info');
        }
      });
    }

    // 找到最近的卡片
    function findClosestItem(container: HTMLDivElement): number {
      const items = container.querySelectorAll('.slot-item');
      const viewportCenter = window.innerWidth / 2;
      const containerLeft = checkAndResetPosition(container);
      
      let closestIndex = 0;
      let minDistance = Infinity;
      
      items.forEach((item, index) => {
        const itemLeft = index * itemWidth + containerLeft;
        const itemCenter = itemLeft + itemWidth / 2;
        const distance = Math.abs(itemCenter - viewportCenter);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });
      
      return closestIndex;
    }

    // 第一阶段动画
    function spinPhase1(duration: number): Promise<void> {
      return new Promise(resolve => {
        const container = containerRef.current;
        if (!container) return resolve();
        
        let startLeft = parseFloat(container.style.left || '0');
        const distance = fixedDistanceRef.current;
        const startTime = Date.now();
        
        function animate() {
          const currentContainer = containerRef.current;
          if (!currentContainer) {
            resolve();
            return;
          }
          
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const easedProgress = customEase(progress);
          
          const beforeLeft = parseFloat(currentContainer.style.left || '0');
          checkAndResetPosition(currentContainer);
          const afterLeft = parseFloat(currentContainer.style.left || '0');
          
          if (Math.abs(beforeLeft - afterLeft) > 100) {
            const diff = afterLeft - beforeLeft;
            startLeft += diff;
          }
          
          const currentLeft = startLeft - distance * easedProgress;
          currentContainer.style.left = currentLeft + 'px';
          
          updateSelection(false);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            resolve();
          }
        }
        
        requestAnimationFrame(animate);
      });
    }

    // 第二阶段动画
    function spinPhase2(): Promise<void> {
      return new Promise(resolve => {
        const container = containerRef.current;
        if (!container) return resolve();
        
        const duration = 800;
        const startTime = Date.now();
        const currentLeft = checkAndResetPosition(container);
        const closestIndex = findClosestItem(container);
        const viewportCenter = window.innerWidth / 2;
        const targetLeft = viewportCenter - (closestIndex * itemWidth) - itemWidth / 2;
        const distance = targetLeft - currentLeft;
        
        function animate() {
          const currentContainer = containerRef.current;
          if (!currentContainer) {
            resolve();
            return;
          }
          
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          const easeOut = 1 - Math.pow(1 - progress, 3);
          
          const newLeft = currentLeft + distance * easeOut;
          currentContainer.style.left = newLeft + 'px';
          updateSelection(false);
          
          if (progress < 1) {
            requestAnimationFrame(animate);
          } else {
            currentContainer.style.left = targetLeft + 'px';
            updateSelection(true);
            resolve();
          }
        }
        
        requestAnimationFrame(animate);
      });
    }

    // 开始抽奖
    async function startSpin(): Promise<void> {
      if (isSpinningRef.current) return;
      
      isSpinningRef.current = true;
      onSpinStart?.();
      
      const container = containerRef.current;
      if (!container) return;
      
      // 清除所有选中状态
      container.querySelectorAll('.slot-item').forEach(item => {
        item.classList.remove('selected', 'show-info');
      });
      
      try {
        const apiResponse = await callBackendAPI();
        
        if (apiResponse.success) {
          targetCardRef.current = apiResponse.data;
          
          prepareReelWithTarget(apiResponse.data);
          
          const duration = 3000 + Math.random() * 2000;
          await spinPhase1(duration);
          
          await new Promise(resolve => setTimeout(resolve, 200));
          
          await spinPhase2();
          
          await new Promise(resolve => setTimeout(resolve, 500));
          
          onResult?.(apiResponse.data);
        }
      } catch (error) {
        console.error('抽奖失败:', error);
      } finally {
        isSpinningRef.current = false;
        onSpinEnd?.();
        targetCardRef.current = null;
        fixedDistanceRef.current = 0;
      }
    }

    // 暴露方法给外部
    (window as any).spinSlotMachine = startSpin;

    // 初始化
    initReel();
    updateSelection(false);

    // 清理
    return () => {
      delete (window as any).spinSlotMachine;
    };
  }, [onResult, onSpinStart, onSpinEnd]);

  return (
    <>
      <style jsx global>{`
        .slot-reel {
          width: 100vw;
          height: 250px;
          background: transparent;
          overflow: hidden;
          position: relative;
          margin-bottom: 40px;
        }

        .slot-reel-container {
          position: relative;
          left: 0;
          transition: none;
          display: flex;
          flex-direction: row;
          align-items: center;
          height: 100%;
        }

        .slot-item {
          width: 195px;
          height: 195px;
          min-width: 195px;
          min-height: 195px;
          max-width: 195px;
          max-height: 195px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin: 0 2.5px;
          position: relative;
        }

        .slot-item-blur {
          position: absolute;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, rgba(130, 157, 187, 0.3) 0%, transparent 70%);
          z-index: 0;
        }

        .slot-item-image-wrapper {
          position: relative;
          width: 55%;
          height: 55%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 200ms;
          z-index: 1;
        }

        .slot-item img {
          position: absolute;
          width: 100%;
          height: 100%;
          object-fit: contain;
          inset: 0;
        }

        .slot-item-info {
          position: absolute;
          bottom: -20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(55, 65, 81, 0.4);
          padding: 4px 8px;
          border-radius: 6px;
          max-width: 195px;
          opacity: 0;
          transition: opacity 200ms;
          z-index: 2;
        }

        .slot-item-info p {
          color: white;
          font-weight: 900;
          font-size: 16px;
          white-space: nowrap;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
          line-height: 1.3;
        }

        .slot-item.selected .slot-item-blur {
          width: 80%;
          height: 80%;
        }

        .slot-item.selected .slot-item-image-wrapper {
          transform: scale(1.25);
        }

        .slot-item.selected.show-info .slot-item-info {
          opacity: 1;
        }
      `}</style>
      
      <div className="slot-reel">
        <div className="slot-reel-container" ref={containerRef}></div>
      </div>
    </>
  );
};

export default SlotMachine;