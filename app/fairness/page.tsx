'use client';
import { useI18n } from '../components/I18nProvider';
import BestLiveSidebar from '../components/BestLiveSidebar';

export default function FairnessPage() {
  const { t } = useI18n();
  return (
    <div className="w-full px-4 sm:px-6 md:px-8 pb-12" style={{ paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)', paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)' }}>
      <div className="flex gap-8 max-w-[1248px] mx-auto">
        <div className="flex flex-1 items-stretch gap-6" style={{ width: 'calc(100% - 16rem)' }}>
          <div className="flex flex-col flex-1 items-stretch max-w-full pb-48">
            <div className="flex flex-col items-stretch gap-10 relative pt-4">
              <div className="absolute inset-0 opacity-25 -z-10 bg-no-repeat" style={{ backgroundImage: 'url(/theme/default/bglock.png)', backgroundPosition: 'center -200px' }}></div>
              <div className="flex flex-col items-start gap-6 relative">
                <h1 className="text-[30px] font-extrabold leading-tight" style={{ color: '#cbd5e0' }}>Safety & Fairness</h1>
                <h2 className="text-xl font-extrabold leading-tight" style={{ color: '#cbd5e0' }}>Why Choose FlameDraw</h2>
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
                          src="/theme/default/shield.webp"
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
                          src="/theme/default/card.webp"
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
                          src="/theme/default/present.webp"
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
                          src="/theme/default/money.webp"
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
                          src="/theme/default/lightning.webp"
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
                          src="/theme/default/trophy.webp"
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
                <h2 className="text-xl font-extrabold" style={{ color: '#cbd5e0' }}>How FlameDraw Ensures Fairness</h2>
                <div className="flex flex-col self-stretch">
                  <p style={{ color: '#cbd5e0' }}>At FlameDraw, the safety and confidence of our customers is our top priority. We've implemented rigorous measures to ensure every aspect of our website is secure and meets or surpasses industry standards. Our commitment to provable fairness guarantees that every outcome is random, impervious to tampering, and open to validation by anyone.</p>
                  <p style={{ color: '#cbd5e0' }}>For single-pack opens and deal purchases, we combine a random server seed, your client seed, and a nonce into a long string. This string is converted into a very large integer, securely hashed, and then normalized to a ticket number between 1 and 1 million. This method of randomness can easily be verified by passing the client seed, server seed, and nonce into our getTicketNumber function (shown below). For battles, we use the same ticket number generation function but instead of your custom client seed, we use the hash of a future EOS block. This ensures that the outcome of a battle is not known until the block is mined and that other players (or bots) are not able to manipulate the outcome.</p>
                  <p style={{ color: '#cbd5e0' }}>In our Draw game, each result is generated using your client seed, our hashed server seed, and a unique nonce based on the round and line position: <span className="font-mono">nonce = roundIndex × lineCount + lineIndex</span>. This combination produces a ticket number between 1 and 1,000,000. A card flip is considered a win if the ticket number is less than or equal to the survival probability multiplied by 1,000,000. After the game ends, we reveal the unhashed server seed so you can independently confirm each result using the original inputs.</p>
                </div>
              </div>
              
              <div className="flex flex-col items-start gap-6">
                <h2 className="text-xl font-extrabold" style={{ color: '#cbd5e0' }}>Terms & Definitions</h2>
                <div className="flex flex-col self-stretch gap-2">
                  <p style={{ color: '#cbd5e0' }}><span className="font-extrabold underline">Ticket Number:</span> An integer value between 1 and 1,000,000 that is the result of combining the random inputs of client seed, server seed, and nonce. This ticket number is then used to look up the resulting product based on that product's ticket number range, which is visible in the pack details.</p>
                  <p style={{ color: '#cbd5e0' }}><span className="font-extrabold underline">Client Seed:</span> A client seed is any string of characters that is known to you before a random result is generated. In single-pack opens, the client seed is provided by you and when combined with the server seed and nonce, used as the source of randomness in our VRF procedure. In battles, the client seed is always a future EOS block hash.</p>
                  <p style={{ color: '#cbd5e0' }}><span className="font-extrabold underline">Server Seed:</span> A server seed is randomly generated by our servers and is super secret. A hash of this value is provided to you before any purchase. To verify randomness, note your server seed hash before purchase, found in your FlameDraw account profile. After your purchase, we expose the unhashed server seed to you. Taking the sha512 hash of your newly exposed (unhashed) server seed, you will get the server seed hash you noted before your purchase. Additionally, combining your server seed, nonce, and client seed (which may be an EOS block hash depending on the game you are playing) and passing it to our getTicketNumber function, you can verify the result.</p>
                  <p style={{ color: '#cbd5e0' }}><span className="font-extrabold underline">Nonce:</span> A nonce is simply an auto-incrementing number that is used by our getTicketNumber function to provide a unique random result when server seeds and client seeds remain unchanged, as is the case when opening multiple packs in a single purchase. e.g. battles or multi-pack opens.</p>
                  <p style={{ color: '#cbd5e0' }}><span className="font-extrabold underline">EOS Block Hash:</span> EOS is a decentralized block chain that typically produces a new block every half a second. By taking the hash of a future EOS block, we can ensure that neither the players nor FlameDraw can know about or influence the outcome once a battle starts. This system guarantees that the result is fair and cannot be tampered with, as the outcome is calculated based on factors that are not alterable or predictable by either party.</p>
                </div>
              </div>
              
              <div className="flex flex-col items-start gap-6">
                <h2 className="text-xl font-extrabold" style={{ color: '#cbd5e0' }}>Verifying Randomness</h2>
                <p style={{ color: '#cbd5e0' }}>To maintain transparency, we provide a set of functions that can be used to verify the fairness of your outcomes. You can use these functions to verify the resulting ticket number you received after purchase. The client seed, server seed, and nonce used for any pack opening or battle can be found in your pack purchase history or battle history, located within your FlameDraw account profile.</p>
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
        <BestLiveSidebar />
      </div>
    </div>
  );
}

