'use client';
import { useI18n } from '../components/I18nProvider';
import LiveFeedElement from '../components/LiveFeedElement';
import LiveFeedTicker from '../components/LiveFeedTicker';

export default function FairnessPage() {
  const { t } = useI18n();
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 pb-12" style={{ paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)', paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)' }}>
      <div className="flex gap-8 max-w-[1248px] mx-auto">
        <div className="flex flex-1 items-stretch gap-6" style={{ width: 'calc(100% - 16rem)' }}>
          <div className="flex flex-col flex-1 items-stretch max-w-full pb-48">
            <div className="flex flex-col items-stretch gap-10 relative pt-4">
              <div className="absolute inset-0 opacity-25 -z-10 bg-no-repeat" style={{ backgroundImage: 'url(https://packdraw.com/_next/static/media/bg.7b65334e.png)', backgroundPosition: 'center -200px' }}></div>
              <div className="flex flex-col items-start gap-6 relative">
                <h1 className="text-[30px] font-extrabold leading-tight" style={{ color: '#cbd5e0' }}>Safety & Fairness</h1>
                <h2 className="text-xl font-extrabold leading-tight" style={{ color: '#cbd5e0' }}>Why Choose PackDraw</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 self-stretch">
                  {/* Reliable & Trusted */}
                  <div>
                    <div className="flex items-center gap-6 rounded-md h-full p-4" style={{ backgroundColor: 'rgba(41, 44, 48, 0.5)' }}>
                      <div className="flex items-center justify-center px-1 w-12 h-12 flex-none">
                        <img
                          alt="title"
                          loading="lazy"
                          width={50}
                          height={50}
                          decoding="async"
                          src="https://packdraw.com/images/fairness/shield.png"
                          style={{ color: 'transparent', width: '100%' }}
                        />
                      </div>
                      <div className="flex flex-col items-start space-y-0">
                        <p className="text-lg font-extrabold" style={{ color: '#cbd5e0' }}>Reliable & Trusted</p>
                        <p className="text-sm" style={{ color: '#cbd5e0' }}>Open packs with confidence on our secure and trusted website.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Simple, Fast Payment Methods */}
                  <div>
                    <div className="flex items-center gap-6 rounded-md h-full p-4" style={{ backgroundColor: 'rgba(41, 44, 48, 0.5)' }}>
                      <div className="flex items-center justify-center px-1 w-12 h-12 flex-none">
                        <img
                          alt="title"
                          loading="lazy"
                          width={50}
                          height={50}
                          decoding="async"
                          src="https://packdraw.com/images/fairness/card.png"
                          style={{ color: 'transparent', width: '100%' }}
                        />
                      </div>
                      <div className="flex flex-col items-start space-y-0">
                        <p className="text-lg font-extrabold" style={{ color: '#cbd5e0' }}>Simple, Fast Payment Methods</p>
                        <p className="text-sm" style={{ color: '#cbd5e0' }}>Make lightning-fast deposits and payout withdrawals with no daily withdrawal limit.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Bigger & Better Rewards */}
                  <div>
                    <div className="flex items-center gap-6 rounded-md h-full p-4" style={{ backgroundColor: 'rgba(41, 44, 48, 0.5)' }}>
                      <div className="flex items-center justify-center px-1 w-12 h-12 flex-none">
                        <img
                          alt="title"
                          loading="lazy"
                          width={50}
                          height={50}
                          decoding="async"
                          src="https://packdraw.com/images/fairness/present.png"
                          style={{ color: 'transparent', width: '100%' }}
                        />
                      </div>
                      <div className="flex flex-col items-start space-y-0">
                        <p className="text-lg font-extrabold" style={{ color: '#cbd5e0' }}>Bigger & Better Rewards</p>
                        <p className="text-sm" style={{ color: '#cbd5e0' }}>Earn XP from opening packs to unlock daily rewards or participate in exciting daily and monthly races.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Always Something New */}
                  <div>
                    <div className="flex items-center gap-6 rounded-md h-full p-4" style={{ backgroundColor: 'rgba(41, 44, 48, 0.5)' }}>
                      <div className="flex items-center justify-center px-1 w-12 h-12 flex-none">
                        <img
                          alt="title"
                          loading="lazy"
                          width={50}
                          height={50}
                          decoding="async"
                          src="https://packdraw.com/images/fairness/money.png"
                          style={{ color: 'transparent', width: '100%' }}
                        />
                      </div>
                      <div className="flex flex-col items-start space-y-0">
                        <p className="text-lg font-extrabold" style={{ color: '#cbd5e0' }}>Always Something New</p>
                        <p className="text-sm" style={{ color: '#cbd5e0' }}>Enjoy constant innovation and regular feature, pack, and product updates.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Fastest Growing Community */}
                  <div>
                    <div className="flex items-center gap-6 rounded-md h-full p-4" style={{ backgroundColor: 'rgba(41, 44, 48, 0.5)' }}>
                      <div className="flex items-center justify-center px-1 w-12 h-12 flex-none">
                        <img
                          alt="title"
                          loading="lazy"
                          width={50}
                          height={50}
                          decoding="async"
                          src="https://packdraw.com/images/fairness/lightning.png"
                          style={{ color: 'transparent', width: '100%' }}
                        />
                      </div>
                      <div className="flex flex-col items-start space-y-0">
                        <p className="text-lg font-extrabold" style={{ color: '#cbd5e0' }}>Fastest Growing Community</p>
                        <p className="text-sm" style={{ color: '#cbd5e0' }}>Join the fun with hundreds of thousands of users from across the world.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* The Undisputed King of Fun */}
                  <div>
                    <div className="flex items-center gap-6 rounded-md h-full p-4" style={{ backgroundColor: 'rgba(41, 44, 48, 0.5)' }}>
                      <div className="flex items-center justify-center px-1 w-12 h-12 flex-none">
                        <img
                          alt="title"
                          loading="lazy"
                          width={50}
                          height={50}
                          decoding="async"
                          src="https://packdraw.com/images/fairness/trophy.png"
                          style={{ color: 'transparent', width: '100%' }}
                        />
                      </div>
                      <div className="flex flex-col items-start space-y-0">
                        <p className="text-lg font-extrabold" style={{ color: '#cbd5e0' }}>The Undisputed King of Fun</p>
                        <p className="text-sm" style={{ color: '#cbd5e0' }}>Experience gamified shopping like never before.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col items-start gap-6">
                <h2 className="text-xl font-extrabold" style={{ color: '#cbd5e0' }}>How PackDraw Ensures Fairness</h2>
                <div className="flex flex-col self-stretch">
                  <p style={{ color: '#cbd5e0' }}>At PackDraw, the safety and confidence of our customers is our top priority. We've implemented rigorous measures to ensure every aspect of our website is secure and meets or surpasses industry standards. Our commitment to provable fairness guarantees that every outcome is random, impervious to tampering, and open to validation by anyone.</p>
                  <p style={{ color: '#cbd5e0' }}>For single-pack opens and deal purchases, we combine a random server seed, your client seed, and a nonce into a long string. This string is converted into a very large integer, securely hashed, and then normalized to a ticket number between 1 and 1 million. This method of randomness can easily be verified by passing the client seed, server seed, and nonce into our getTicketNumber function (shown below). For battles, we use the same ticket number generation function but instead of your custom client seed, we use the hash of a future EOS block. This ensures that the outcome of a battle is not known until the block is mined and that other players (or bots) are not able to manipulate the outcome.</p>
                  <p style={{ color: '#cbd5e0' }}>In our Draw game, each result is generated using your client seed, our hashed server seed, and a unique nonce based on the round and line position: <span className="font-mono">nonce = roundIndex × lineCount + lineIndex</span>. This combination produces a ticket number between 1 and 1,000,000. A card flip is considered a win if the ticket number is less than or equal to the survival probability multiplied by 1,000,000. After the game ends, we reveal the unhashed server seed so you can independently confirm each result using the original inputs.</p>
                </div>
              </div>
              
              <div className="flex flex-col items-start gap-6">
                <h2 className="text-xl font-extrabold" style={{ color: '#cbd5e0' }}>Terms & Definitions</h2>
                <div className="flex flex-col self-stretch gap-2">
                  <p style={{ color: '#cbd5e0' }}><span className="font-extrabold underline">Ticket Number:</span> An integer value between 1 and 1,000,000 that is the result of combining the random inputs of client seed, server seed, and nonce. This ticket number is then used to look up the resulting product based on that product's ticket number range, which is visible in the pack details.</p>
                  <p style={{ color: '#cbd5e0' }}><span className="font-extrabold underline">Client Seed:</span> A client seed is any string of characters that is known to you before a random result is generated. In single-pack opens, the client seed is provided by you and when combined with the server seed and nonce, used as the source of randomness in our VRF procedure. In battles, the client seed is always a future EOS block hash.</p>
                  <p style={{ color: '#cbd5e0' }}><span className="font-extrabold underline">Server Seed:</span> A server seed is randomly generated by our servers and is super secret. A hash of this value is provided to you before any purchase. To verify randomness, note your server seed hash before purchase, found in your PackDraw account profile. After your purchase, we expose the unhashed server seed to you. Taking the sha512 hash of your newly exposed (unhashed) server seed, you will get the server seed hash you noted before your purchase. Additionally, combining your server seed, nonce, and client seed (which may be an EOS block hash depending on the game you are playing) and passing it to our getTicketNumber function, you can verify the result.</p>
                  <p style={{ color: '#cbd5e0' }}><span className="font-extrabold underline">Nonce:</span> A nonce is simply an auto-incrementing number that is used by our getTicketNumber function to provide a unique random result when server seeds and client seeds remain unchanged, as is the case when opening multiple packs in a single purchase. e.g. battles or multi-pack opens.</p>
                  <p style={{ color: '#cbd5e0' }}><span className="font-extrabold underline">EOS Block Hash:</span> EOS is a decentralized block chain that typically produces a new block every half a second. By taking the hash of a future EOS block, we can ensure that neither the players nor PackDraw can know about or influence the outcome once a battle starts. This system guarantees that the result is fair and cannot be tampered with, as the outcome is calculated based on factors that are not alterable or predictable by either party.</p>
                </div>
              </div>
              
              <div className="flex flex-col items-start gap-6">
                <h2 className="text-xl font-extrabold" style={{ color: '#cbd5e0' }}>Verifying Randomness</h2>
                <p style={{ color: '#cbd5e0' }}>To maintain transparency, we provide a set of functions that can be used to verify the fairness of your outcomes. You can use these functions to verify the resulting ticket number you received after purchase. The client seed, server seed, and nonce used for any pack opening or battle can be found in your pack purchase history or battle history, located within your PackDraw account profile.</p>
                <div className="flex p-4 whitespace-pre-wrap font-mono text-[13px]" style={{ backgroundColor: '#22272b', color: '#FAFAFA' }}>
{`import crypto from 'crypto'

export const sha512 = (value: string) => crypto.createHash('sha512').update(value).digest('hex')

export const combineSeeds = (clientSeed: string, serverSeed: string, nonce: number) => sha512(\`\${clientSeed}:\${serverSeed}:\${nonce}\`)

export const getTicketNumber = (hash: string) => {
  const hashInt = BigInt('0x' + hash)
  const maxInt = BigInt(1_000_000)
  return Number((hashInt % maxInt) + BigInt(1))
}`}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden lg:block flex-shrink-0" style={{ width: '224px' }}>
          <div className="rounded-lg px-0 pb-4 pt-0 h-fit" >
            <div className="flex pb-4 gap-2 items-center">
              <div className="flex size-4 text-yellow-400">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_2938_10681)">
                    <path d="M7.34447 1.87599C7.37304 1.72306 7.45419 1.58493 7.57387 1.48553C7.69355 1.38614 7.84423 1.33173 7.99981 1.33173C8.15538 1.33173 8.30606 1.38614 8.42574 1.48553C8.54542 1.58493 8.62657 1.72306 8.65514 1.87599L9.35581 5.58132C9.40557 5.84475 9.53359 6.08707 9.72316 6.27664C9.91273 6.46621 10.155 6.59423 10.4185 6.64399L14.1238 7.34466C14.2767 7.37322 14.4149 7.45437 14.5143 7.57405C14.6137 7.69374 14.6681 7.84441 14.6681 7.99999C14.6681 8.15557 14.6137 8.30624 14.5143 8.42592C14.4149 8.54561 14.2767 8.62676 14.1238 8.65532L10.4185 9.35599C10.155 9.40575 9.91273 9.53377 9.72316 9.72334C9.53359 9.91291 9.40557 10.1552 9.35581 10.4187L8.65514 14.124C8.62657 14.2769 8.54542 14.415 8.42574 14.5144C8.30606 14.6138 8.15538 14.6683 7.99981 14.6683C7.84423 14.6683 7.69355 14.6138 7.57387 14.5144C7.45419 14.415 7.37304 14.2769 7.34447 14.124L6.64381 10.4187C6.59404 10.1552 6.46602 9.91291 6.27645 9.72334C6.08688 9.53377 5.84457 9.40575 5.58114 9.35599L1.87581 8.65532C1.72287 8.62676 1.58475 8.54561 1.48535 8.42592C1.38595 8.30624 1.33154 8.15557 1.33154 7.99999C1.33154 7.84441 1.38595 7.69374 1.48535 7.57405C1.58475 7.45437 1.72287 7.37322 1.87581 7.34466L5.58114 6.64399C5.84457 6.59423 6.08688 6.46621 6.27645 6.27664C6.46602 6.08707 6.59404 5.84475 6.64381 5.58132L7.34447 1.87599Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M13.3335 1.33331V3.99998" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                    <path d="M14.6667 2.66669H12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_2938_10681">
                      <rect width="16" height="16" fill="currentColor"></rect>
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <p className="text-base text-white font-extrabold">{t('bestOpens')}</p>
            </div>
            <div className="live-feed flex flex-col gap-3">
              <LiveFeedElement
                index={0}
                href="/packs/1"
                avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                productImageUrl="https://ik.imagekit.io/hr727kunx/products/cm9ln14rj0002l50g0sajx4dg_2344464__pFeElsrMCp?tr=w-1080,c-at_max"
                packImageUrl="https://ik.imagekit.io/hr727kunx/community_packs/cm18eb8ji001kugiildnpy8fm/packs/cm18eb8ji001kugiildnpy8fm_hQOMiytlLO.png?tr=q-50,w-1080,c-at_max"
                title="Audemars Piguet Stainless Steel USA Edition"
                priceLabel="$65,000.00"
              />
              <LiveFeedElement
                index={1}
                href="/packs/2"
                avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                productImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgmus9260000l80gpntkfktl_3232094__fSM1fwIYl1?tr=w-1080,c-at_max"
                packImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmh2lqffk001al10paqslua2f_2229948__zIR8y5q-G?tr=w-1080,c-at_max"
                title="Limited Edition Pack"
                priceLabel="$2.99"
                glowColor="#FACC15"
              />
              <LiveFeedElement
                index={2}
                href="/packs/3"
                avatarUrl="https://ik.imagekit.io/hr727kunx/profile_pictures/cm0aij6zj00561rzns7vbtwxi/cm0aij6zj00561rzns7vbtwxi_68ZiGZar8.png?tr=w-128,c-at_max"
                productImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgo6ok710000k10g5r0il5rk_7104681__d8no0nmco?tr=w-1080,c-at_max"
                packImageUrl="https://ik.imagekit.io/hr727kunx/packs/cmgo8hdp90000l40gxmfk970t_5020787__2hFmzl5eh?tr=w-1080,c-at_max"
                title="Special Drop"
                priceLabel="$5.00"
                glowColor="#FACC15"
              />
            </div>
          </div>
          <div className="rounded-lg px-0 pb-4 pt-0 h-fit mt-6" >
            <div className="flex pb-4 gap-2 items-center">
              <div className="flex size-4 text-yellow-400">
                <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7.5" stroke="#EB4B4B" strokeOpacity="0.5"></circle><circle cx="8" cy="8" r="2" fill="#EB4B4B"></circle></svg>
              </div>
              <p className="text-base text-white font-extrabold">{t('liveStart')}</p>
            </div>
            <LiveFeedTicker maxItems={9} intervalMs={2000} />
          </div>
        </div>
      </div>
    </div>
  );
}

