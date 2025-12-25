"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import type { WalletClient } from "viem";
import { ethers } from "ethers";
import {
  Shield,
  Lock,
  Vote,
  CheckCircle2,
  Clock,
  AlertCircle,
  Info,
  Key,
  Eye,
  EyeOff,
  FileText,
  Settings,
  Users,
  BarChart3,
  Sparkles,
  Zap,
  Network,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
  LockKeyhole,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

import { EncryptedSurveyAddresses } from "@/abi/EncryptedSurveyAddresses";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useEncryptedSurvey } from "@/hooks/useEncryptedSurvey";

const initialMockChains = { 31337: "http://localhost:8545" } as const;

function getExternalProvider(walletClient: WalletClient) {
  const transport = (walletClient.transport as unknown as { value?: unknown })?.value;
  if (transport && typeof transport === "object") {
    return transport;
  }
  if (typeof window !== "undefined") {
    return (window as unknown as { ethereum?: unknown }).ethereum;
  }
  return undefined;
}

async function walletClientToEthers(walletClient: WalletClient) {
  const external = getExternalProvider(walletClient);
  if (!external || typeof (external as { request?: unknown }).request !== "function") {
    throw new Error("Unsupported wallet transport");
  }

  const provider = new ethers.BrowserProvider(external as ethers.Eip1193Provider, walletClient.chain?.id);
  const addresses = await walletClient.getAddresses();
  const address = addresses[0];
  if (!address) {
    throw new Error("Unable to determine wallet address");
  }

  const signer = await provider.getSigner(address);
  return { provider, signer };
}

export function EncryptedSurveyDashboard() {
  const { storage } = useInMemoryStorage();
  const { address, chain, isConnected } = useAccount();
  const chainId = chain?.id;
  const { data: walletClient } = useWalletClient();

  const [ethersSigner, setEthersSigner] = useState<ethers.Signer | undefined>();
  const [ethersProvider, setEthersProvider] = useState<ethers.ContractRunner | undefined>();
  const [providerReady, setProviderReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function syncSigner() {
      if (!walletClient) {
        setEthersSigner(undefined);
        setEthersProvider(undefined);
        setProviderReady(false);
        return;
      }

      try {
        const { provider, signer } = await walletClientToEthers(walletClient);
        if (cancelled) return;
        setEthersSigner(signer);
        setEthersProvider(provider);
        setProviderReady(true);
      } catch {
        if (cancelled) return;
        setEthersSigner(undefined);
        setEthersProvider(undefined);
        setProviderReady(false);
      }
    }

    void syncSigner();

    return () => {
      cancelled = true;
    };
  }, [walletClient]);

  const eip1193Provider = useMemo(() => {
    if (!walletClient) return undefined;
    type RequestArgs = Parameters<typeof walletClient.request>[0];
    return {
      request: (args: RequestArgs) => walletClient.request(args),
    };
  }, [walletClient]);

  const {
    instance: fhevmInstance,
    status: fhevmStatus,
    error: fhevmError,
  } = useFhevm({
    provider: eip1193Provider,
    chainId,
    initialMockChains,
    enabled: Boolean(eip1193Provider),
  });

  const contractAddress = useMemo(() => {
    if (!chainId) return undefined;
    const entry = EncryptedSurveyAddresses[chainId.toString() as keyof typeof EncryptedSurveyAddresses];
    if (!entry || entry.address === "0x0000000000000000000000000000000000000000") {
      return undefined;
    }
    return entry.address as `0x${string}`;
  }, [chainId]);

  const survey = useEncryptedSurvey({
    instance: fhevmInstance,
    storage,
    ethersSigner,
    ethersProvider,
    contractAddress,
    account: address as `0x${string}` | undefined,
  });

  const [questionDraft, setQuestionDraft] = useState<string>("How satisfied are you with remote work?");
  const [optionDraft, setOptionDraft] = useState<string>("Very satisfied\nNeutral\nNot satisfied");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [voteWeight, setVoteWeight] = useState<string>("1");
  const [granteeAddress, setGranteeAddress] = useState<string>("");
  const [grantOptionIndex, setGrantOptionIndex] = useState<number>(0);

  useEffect(() => {
    if (!survey.isConfigured) {
      setSelectedOption(null);
    }
  }, [survey.isConfigured]);

  const optionLines = useMemo(
    () =>
      optionDraft
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean),
    [optionDraft],
  );

  const showContractWarning = Boolean(chainId && !contractAddress);

  const canVote =
    isConnected &&
    survey.isConfigured &&
    !survey.hasVoted &&
    !survey.isFinalized &&
    typeof selectedOption === "number" &&
    voteWeight.trim().length > 0 &&
    !survey.isSubmitting;

  const formattedStatus = survey.statusMessage ||
    (fhevmStatus === "loading" ? "Preparing FHE runtime..." : "");

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:py-8 animate-fade-in relative">
      {/* Background decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-pink-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="flex flex-col gap-4 rounded-3xl border border-slate-200/80 glass-effect p-4 sm:p-6 shadow-2xl hover-lift smooth-transition animate-slide-up relative overflow-hidden group">
        {/* Animated gradient background */}
        <div className="absolute inset-0 gradient-bg opacity-30 -z-10"></div>
        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-200/40 rounded-full blur-3xl -mr-20 -mt-20 floating"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-200/40 rounded-full blur-2xl -ml-16 -mb-16 floating" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-pink-200/30 rounded-full blur-xl floating" style={{ animationDelay: '4s' }}></div>
        
        {/* Shimmer effect */}
        <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100 smooth-transition"></div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative group/logo">
              <div className="absolute inset-0 bg-indigo-300 rounded-2xl blur-xl opacity-60 animate-pulse"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl blur-lg opacity-50"></div>
              <div className="relative bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-2.5 rounded-2xl shadow-2xl glow-effect smooth-transition group-hover/logo:scale-110 group-hover/logo:rotate-3">
                <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-lg" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Encrypted Survey Voting</h1>
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500 animate-pulse" />
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5 flex items-center gap-1.5">
                <LockKeyhole className="h-3 w-3" />
                Privacy-first feedback collection with fully homomorphic encryption
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
          <ConnectButton showBalance={false} chainStatus="icon" />
          </div>
        </div>
        <div className="relative z-10 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700 font-medium smooth-transition hover:bg-indigo-100 hover:scale-105">
            <Network className="h-3 w-3" />
            {chain?.name ?? "Not connected"}
          </span>
          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-medium smooth-transition hover:scale-105 ${
            fhevmStatus === "ready" 
              ? "bg-green-50 text-green-700 hover:bg-green-100" 
              : fhevmStatus === "loading"
              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}>
            {fhevmStatus === "ready" ? (
              <ShieldCheck className="h-3 w-3" />
            ) : fhevmStatus === "loading" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Lock className="h-3 w-3" />
            )}
            FHE: {fhevmStatus === "ready" ? "Ready" : fhevmStatus === "loading" ? "Loading..." : fhevmStatus}
          </span>
          {fhevmError && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-1 text-rose-600 font-medium">
              <AlertCircle className="h-3 w-3" />
              Initialization failed
            </span>
          )}
        </div>
      </header>

      {showContractWarning && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 shadow-sm animate-slide-up smooth-transition hover:shadow-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5 animate-bounce-subtle" />
          <p>
              No contract found for this network. Please deploy the contract or switch networks.
          </p>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm animate-scale-in smooth-transition hover:shadow-md">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-200 rounded-full blur-xl opacity-50"></div>
                <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-full">
                  <Key className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div>
              <p className="text-slate-700 font-semibold text-base">Connect your wallet to get started</p>
              <p className="text-xs text-slate-500 mt-1.5">Click the connect button in the header to begin</p>
            </div>
          </div>
        </div>
      )}

      {isConnected && !providerReady && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm animate-scale-in smooth-transition">
          <div className="flex items-center justify-center gap-3 text-slate-600">
            <Loader2 className="h-5 w-5 text-indigo-600 animate-spin" />
            <p className="font-medium">Preparing wallet connection...</p>
          </div>
        </div>
      )}

      {isConnected && providerReady && (
        <>
          <section className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 sm:p-6 shadow-xl hover-lift smooth-transition animate-slide-up relative overflow-hidden group" style={{ animationDelay: '0.1s' }}>
              {/* Decorative gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100/50 to-purple-100/50 rounded-full blur-2xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100/40 rounded-full blur-xl -ml-12 -mb-12"></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative group/icon">
                    <div className="absolute inset-0 bg-indigo-200 rounded-lg blur-md opacity-50 group-hover/icon:opacity-75 smooth-transition"></div>
                    <div className="relative p-1.5 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg shadow-md smooth-transition group-hover/icon:scale-110">
                      <FileText className="h-4 w-4 text-indigo-600" />
                    </div>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">Survey Overview</h2>
                </div>
              {survey.isConfigured ? (
                <>
                  <p className="text-sm sm:text-base text-slate-700 font-medium mb-4 leading-relaxed">
                    {survey.question}
                  </p>
                  <dl className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-slate-100/80">
                      <dt className="text-slate-600 flex items-center gap-1.5">
                        <div className="p-1 bg-slate-100 rounded-md">
                          <Clock className="h-3 w-3 text-slate-600" />
                        </div>
                        Status
                      </dt>
                      <dd className="font-semibold">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs shadow-sm ${
                          survey.isFinalized 
                            ? "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700" 
                            : "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700"
                        }`}>
                          {survey.isFinalized ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : survey.isConfigured ? (
                            <Zap className="h-3 w-3 animate-pulse" />
                          ) : null}
                    {survey.isConfigured ? (survey.isFinalized ? "Finalized" : "Active") : "Pending setup"}
                        </span>
                  </dd>
                </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-100/80">
                      <dt className="text-slate-600 flex items-center gap-1.5">
                        <div className="p-1 bg-slate-100 rounded-md">
                          <Vote className="h-3 w-3 text-slate-600" />
                        </div>
                        Your vote
                      </dt>
                      <dd className="font-semibold">
                        {survey.hasVoted ? (
                          <span className="text-green-600 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-green-50 shadow-sm">
                            <div className="relative">
                              <div className="absolute inset-0 bg-green-300 rounded-full blur-sm opacity-50 animate-pulse"></div>
                              <CheckCircle2 className="relative h-4 w-4" />
                            </div>
                            Submitted
                          </span>
                        ) : (
                          <span className="text-slate-400 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50">
                            <XCircle className="h-4 w-4" />
                            Not yet
                          </span>
                        )}
                  </dd>
                </div>
                    {survey.contractAddress && (
                      <div className="flex items-center justify-between py-2">
                        <dt className="text-slate-600 flex items-center gap-1.5">
                          <div className="p-1 bg-slate-100 rounded-md">
                            <Network className="h-3 w-3 text-slate-600" />
                          </div>
                          Contract
                        </dt>
                        <dd className="text-xs text-slate-500 font-mono px-2 py-1 bg-slate-50 rounded-md border border-slate-200">
                          {survey.contractAddress.slice(0, 6)}...{survey.contractAddress.slice(-4)}
                        </dd>
                      </div>
                    )}
              </dl>
                </>
              ) : (
                <p className="text-sm text-slate-500">No survey configured yet.</p>
              )}
              </div>
            </article>

            {!survey.isConfigured && (
              <article className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/30 p-5 sm:p-6 shadow-xl hover-lift smooth-transition animate-slide-up relative overflow-hidden group" style={{ animationDelay: '0.2s' }}>
                {/* Animated background elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/30 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-200/30 rounded-full blur-2xl -ml-16 -mb-16 animate-pulse" style={{ animationDelay: '1s' }}></div>
                
                <div className="relative z-10 mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="relative group/icon">
                      <div className="absolute inset-0 bg-purple-300 rounded-lg blur-lg opacity-50 group-hover/icon:opacity-75 smooth-transition"></div>
                      <div className="relative p-1.5 bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 rounded-lg shadow-lg smooth-transition group-hover/icon:scale-110 group-hover/icon:rotate-6">
                        <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
                      </div>
                    </div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">Create Survey</h2>
                  </div>
                  <p className="ml-8 text-xs sm:text-sm text-slate-600">
                    Anyone can create a survey. Options are separated by new lines.
                  </p>
                </div>
                <form
                  className="space-y-4 relative z-10"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    await survey.configureSurvey(questionDraft.trim(), optionLines);
                  }}
                >
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-indigo-600" />
                      Survey question
                    </label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-purple-100/50 rounded-xl blur-sm opacity-0 group-hover:opacity-100 smooth-transition"></div>
                    <input
                        className="relative w-full rounded-xl border-2 border-slate-300 bg-white/90 backdrop-blur-sm px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 smooth-transition hover:border-indigo-400 hover:shadow-md"
                      value={questionDraft}
                      onChange={(event) => setQuestionDraft(event.target.value)}
                      placeholder="What should we ask participants?"
                    />
                  </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <BarChart3 className="h-4 w-4 text-indigo-600" />
                      Options <span className="text-xs text-slate-500 font-normal">(one per line, minimum 2)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-pink-100/50 rounded-xl blur-sm opacity-0 group-hover:opacity-100 smooth-transition"></div>
                    <textarea
                        className="relative h-28 w-full resize-none rounded-xl border-2 border-slate-300 bg-white/90 backdrop-blur-sm px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 smooth-transition hover:border-indigo-400 hover:shadow-md"
                      value={optionDraft}
                      onChange={(event) => setOptionDraft(event.target.value)}
                        placeholder="Option 1&#10;Option 2&#10;Option 3"
                    />
                    </div>
                    {optionLines.length > 0 && optionLines.length < 2 && (
                      <p className="text-xs text-amber-600">Please add at least 2 options</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={optionLines.length < 2 || survey.isSubmitting || !questionDraft.trim()}
                    className="relative w-full rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-200 bg-pos-0 hover:bg-pos-100 px-4 py-2.5 text-sm font-semibold text-white shadow-xl smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-2 overflow-hidden group/btn"
                    style={{ backgroundSize: '200% 100%' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full smooth-transition duration-1000"></div>
                    {survey.isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Create Survey
                      </>
                    )}
                  </button>
                </form>
              </article>
            )}

            {survey.isConfigured && (
              <article className="rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-sm p-5 sm:p-6 shadow-xl hover-lift smooth-transition animate-slide-up relative overflow-hidden group" style={{ animationDelay: '0.2s' }}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-36 h-36 bg-blue-200/30 rounded-full blur-3xl -mr-18 -mt-18"></div>
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-cyan-200/30 rounded-full blur-2xl -ml-14 -mb-14"></div>
                
                <div className="relative z-10 mb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="relative group/icon">
                      <div className="absolute inset-0 bg-blue-200 rounded-lg blur-md opacity-50 group-hover/icon:opacity-75 smooth-transition"></div>
                      <div className="relative p-1.5 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg shadow-md smooth-transition group-hover/icon:scale-110 group-hover/icon:-rotate-6">
                        <Settings className="h-4 w-4 text-blue-600" />
                      </div>
                    </div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">Survey Controls</h2>
                  </div>
                  <p className="ml-8 text-xs sm:text-sm text-slate-600">
                    Manage survey settings and permissions
                  </p>
                </div>
                <div className="space-y-3 relative z-10">
                  <button
                    className="relative w-full rounded-xl border-2 border-slate-300 bg-gradient-to-r from-white to-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700 smooth-transition hover:border-indigo-500 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-slate-300 disabled:hover:bg-white disabled:hover:text-slate-700 disabled:hover:scale-100 flex items-center justify-center gap-2 overflow-hidden group/btn"
                    disabled={survey.isFinalized || survey.isSubmitting}
                    onClick={async () => {
                      await survey.finalizeSurvey();
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:translate-x-full smooth-transition duration-700"></div>
                    {survey.isFinalized ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Survey Finalized
                      </>
                    ) : survey.isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Finalizing...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Finalize Survey
                      </>
                    )}
                  </button>
                  <div className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 to-indigo-50/30 p-4 smooth-transition hover:bg-gradient-to-br hover:from-slate-50 hover:to-indigo-50 hover:shadow-md relative overflow-hidden group/grant">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-100/40 rounded-full blur-xl -mr-10 -mt-10"></div>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="relative">
                          <div className="absolute inset-0 bg-indigo-200 rounded-full blur-sm opacity-50"></div>
                          <Key className="relative h-4 w-4 text-indigo-600" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800">Grant Access</h3>
                      </div>
                      <p className="text-xs text-slate-600 mb-3 ml-6">
                        Allow someone to decrypt results. Requires at least one vote first.
                      </p>
                      <div className="space-y-2.5 relative z-10">
                      <div className="relative">
                        <div className="absolute inset-0 bg-indigo-100/30 rounded-xl blur-sm opacity-0 group-hover/grant:opacity-100 smooth-transition"></div>
                      <input
                          className="relative w-full rounded-xl border-2 border-slate-300 bg-white/90 backdrop-blur-sm px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 smooth-transition hover:border-indigo-400 hover:shadow-sm"
                          placeholder="Enter wallet address"
                        value={granteeAddress}
                        onChange={(event) => setGranteeAddress(event.target.value)}
                      />
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-purple-100/30 rounded-xl blur-sm opacity-0 group-hover/grant:opacity-100 smooth-transition"></div>
                      <select
                          className="relative w-full rounded-xl border-2 border-slate-300 bg-white/90 backdrop-blur-sm px-3 py-2 text-xs text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 smooth-transition hover:border-indigo-400 hover:shadow-sm"
                        value={grantOptionIndex}
                        onChange={(event) => setGrantOptionIndex(Number(event.target.value))}
                      >
                        {survey.options.map((option) => (
                          <option key={option.index} value={option.index}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      </div>
                      <button
                        className="relative w-full rounded-xl bg-gradient-to-r from-slate-700 to-slate-800 px-4 py-2 text-xs font-semibold text-white shadow-lg smooth-transition hover:from-slate-800 hover:to-slate-900 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-1.5 overflow-hidden group/btn"
                        disabled={!ethers.isAddress(granteeAddress) || survey.isSubmitting}
                        onClick={async () => {
                          try {
                          await survey.allowResultFor(granteeAddress as `0x${string}`, grantOptionIndex);
                          } catch (error) {
                            console.error("Failed to grant access:", error);
                          }
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full smooth-transition duration-700"></div>
                        {survey.isSubmitting ? (
                          <span className="relative flex items-center justify-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Granting...
                          </span>
                        ) : (
                          <span className="relative flex items-center gap-1.5">
                            <Key className="h-3 w-3" />
                            Grant Access
                          </span>
                        )}
                      </button>
                    </div>
                    </div>
                  </div>
                </div>
              </article>
            )}

            <article className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-green-50/30 to-emerald-50/20 p-5 sm:p-6 shadow-xl hover-lift smooth-transition animate-slide-up relative overflow-hidden group" style={{ animationDelay: '0.3s' }}>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-green-200/30 rounded-full blur-3xl -mr-18 -mt-18 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-emerald-200/30 rounded-full blur-2xl -ml-14 -mb-14 animate-pulse" style={{ animationDelay: '1.5s' }}></div>
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative group/icon">
                    <div className="absolute inset-0 bg-green-300 rounded-lg blur-lg opacity-50 group-hover/icon:opacity-75 smooth-transition"></div>
                    <div className="relative p-1.5 bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 rounded-lg shadow-lg smooth-transition group-hover/icon:scale-110 group-hover/icon:rotate-6">
                      <Vote className="h-4 w-4 text-green-600" />
                    </div>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">Cast Your Vote</h2>
                </div>
              {survey.isConfigured ? (
                <form
                  className="space-y-4 relative z-10"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (typeof selectedOption === "number") {
                      await survey.submitVote(selectedOption, Number(voteWeight || "1"));
                    }
                  }}
                >
                  <fieldset className="space-y-2">
                    <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2 block">
                      Select one option
                    </legend>
                    {survey.options.map((option) => (
                      <label 
                        key={option.index} 
                        className={`relative flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer smooth-transition overflow-hidden group/option ${
                          selectedOption === option.index
                            ? "border-indigo-500 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg scale-[1.02]"
                            : "border-slate-200 hover:border-indigo-300 hover:bg-gradient-to-r hover:from-indigo-50/30 hover:to-purple-50/20 hover:scale-[1.01] hover:shadow-md"
                        } ${survey.hasVoted || survey.isFinalized ? "opacity-60 cursor-not-allowed hover:scale-100" : ""}`}
                      >
                        {selectedOption === option.index && (
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 via-purple-100/50 to-indigo-100/50 animate-pulse"></div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/option:translate-x-full smooth-transition duration-1000"></div>
                        <div className="relative z-10 flex items-center gap-3 flex-1">
                          <div className="relative">
                            {selectedOption === option.index && (
                              <div className="absolute inset-0 bg-indigo-400 rounded-full blur-md opacity-50 animate-pulse"></div>
                            )}
                          <input
                            type="radio"
                            name="survey-option"
                            value={option.index}
                            checked={selectedOption === option.index}
                            onChange={() => setSelectedOption(option.index)}
                            disabled={survey.hasVoted || survey.isFinalized}
                              className="relative h-4 w-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>
                          <span className="text-sm text-slate-900 flex-1 font-medium">{option.label}</span>
                          {selectedOption === option.index && (
                            <CheckCircle2 className="h-4 w-4 text-indigo-600 animate-scale-in" />
                          )}
                        </div>
                      </label>
                    ))}
                  </fieldset>
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Vote weight
                    </label>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-green-100/50 to-emerald-100/50 rounded-xl blur-sm opacity-0 group-hover:opacity-100 smooth-transition"></div>
                    <input
                      type="number"
                      min="1"
                      value={voteWeight}
                      onChange={(event) => setVoteWeight(event.target.value)}
                        className="relative w-full rounded-xl border-2 border-slate-300 bg-white/90 backdrop-blur-sm px-4 py-2.5 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 smooth-transition hover:border-indigo-400 hover:shadow-md"
                    />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={!canVote}
                    className="relative w-full rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-size-200 bg-pos-0 hover:bg-pos-100 px-4 py-2.5 text-sm font-semibold text-white shadow-xl smooth-transition hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none disabled:hover:scale-100 flex items-center justify-center gap-2 overflow-hidden group/btn"
                    style={{ backgroundSize: '200% 100%' }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full smooth-transition duration-1000"></div>
                    {survey.hasVoted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Vote Submitted
                      </>
                    ) : survey.isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Submit Encrypted Vote
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-slate-500">
                  Waiting for survey to be configured.
                </p>
              )}
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-purple-50/20 to-indigo-50/20 p-5 sm:p-6 shadow-xl hover-lift smooth-transition animate-slide-up relative overflow-hidden group" style={{ animationDelay: '0.4s' }}>
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-200/30 rounded-full blur-3xl -mr-20 -mt-20 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-200/30 rounded-full blur-2xl -ml-16 -mb-16 animate-pulse" style={{ animationDelay: '2s' }}></div>
            
            <div className="relative z-10 mb-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="relative group/icon">
                    <div className="absolute inset-0 bg-purple-300 rounded-lg blur-lg opacity-50 group-hover/icon:opacity-75 smooth-transition"></div>
                    <div className="relative p-1.5 bg-gradient-to-br from-purple-100 via-pink-100 to-indigo-100 rounded-lg shadow-lg smooth-transition group-hover/icon:scale-110 group-hover/icon:-rotate-6">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                    </div>
                  </div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">Encrypted Results</h2>
                </div>
                <p className="ml-8 text-xs sm:text-sm text-slate-600">
                  Totals remain encrypted. Anyone can grant themselves access to decrypt results.
                </p>
              </div>
              {survey.isConfigured && survey.options.length > 0 && (
                <button
                  className="relative rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-lg smooth-transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-xl hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none disabled:hover:scale-100 flex-shrink-0 flex items-center gap-1.5 overflow-hidden group/btn"
                  onClick={async () => {
                    await survey.allowAllResultsForSelf();
                  }}
                  disabled={survey.isSubmitting}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full smooth-transition duration-700"></div>
                  {survey.isSubmitting ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Granting...
                    </>
                  ) : (
                    <>
                      <Key className="h-3 w-3" />
                      Get Access to All
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-2 relative z-10">
              {survey.options.map((option, idx) => (
                <div 
                  key={option.index} 
                  className="rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50/80 via-white/50 to-indigo-50/20 p-4 smooth-transition hover:from-slate-50 hover:via-white hover:to-indigo-50/40 hover:shadow-xl hover:scale-[1.02] animate-scale-in relative overflow-hidden group/card"
                  style={{ animationDelay: `${0.5 + idx * 0.1}s` }}
                >
                  {/* Decorative gradient */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-100/40 rounded-full blur-2xl -mr-12 -mt-12"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-purple-100/30 rounded-full blur-xl -ml-10 -mb-10"></div>
                  
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/card:translate-x-full smooth-transition duration-1000"></div>
                  <div className="relative z-10">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3 relative">
                      {option.label}
                      <div className="absolute -left-1 top-0 w-1 h-full bg-gradient-to-b from-indigo-400 to-purple-400 rounded-full opacity-0 group-hover/card:opacity-100 smooth-transition"></div>
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                        {option.decryptedTotal !== undefined ? (
                            <>
                              <div className="flex items-baseline gap-1.5 mb-1">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-green-300 rounded-full blur-lg opacity-60 animate-pulse"></div>
                                  <TrendingUp className="relative h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-2xl font-bold text-slate-900 smooth-transition bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 bg-clip-text text-transparent bg-size-200 bg-pos-0 hover:bg-pos-100" style={{ backgroundSize: '200% 100%' }}>
                                    {option.decryptedTotal.toString()}
                                  </span>
                                  <span className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    vote{option.decryptedTotal.toString() === "1" ? "" : "s"}
                                  </span>
                                </div>
                              </div>
                              {/* Progress bar visualization */}
                              {survey.options.length > 0 && (() => {
                                const totalVotes = survey.options.reduce((sum, opt) => 
                                  sum + (opt.decryptedTotal !== undefined ? Number(opt.decryptedTotal) : 0), 0
                                );
                                const percentage = totalVotes > 0 ? (Number(option.decryptedTotal) / totalVotes) * 100 : 0;
                                return (
                                  <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-green-500 via-emerald-500 to-green-500 rounded-full smooth-transition shadow-sm"
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                );
                              })()}
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="relative">
                                  <div className="absolute inset-0 bg-slate-300 rounded-full blur-lg opacity-50 animate-pulse"></div>
                                  <Lock className="relative h-4 w-4 text-slate-500" />
                                </div>
                                <span className="text-base font-semibold text-slate-600 smooth-transition">Encrypted</span>
                              </div>
                              <span className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                                <ShieldCheck className="h-3 w-3" />
                                Securely stored
                    </span>
                              {/* Encrypted state indicator */}
                              <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-300 via-slate-400 to-slate-300 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                              </div>
                            </>
                          )}
                        </div>
                      <div className="flex gap-2">
                        <div className="flex gap-2 relative z-10">
                          <button
                            className="relative rounded-xl bg-gradient-to-r from-slate-600 to-slate-700 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md smooth-transition hover:from-slate-700 hover:to-slate-800 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:hover:scale-100 flex items-center gap-1 overflow-hidden group/btn"
                            onClick={async () => {
                              try {
                                await survey.allowResultForSelf(option.index);
                              } catch (error) {
                                // Error handling is done in the hook
                              }
                            }}
                            disabled={survey.isSubmitting}
                            title="Get decryption access"
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full smooth-transition duration-500"></div>
                            <Key className="relative h-3 w-3" />
                            <span className="relative">Access</span>
                          </button>
                    <button
                            className="relative rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-md smooth-transition hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:hover:scale-100 flex items-center gap-1 overflow-hidden group/btn"
                      onClick={async () => {
                              try {
                        await survey.decryptOption(option.index);
                              } catch (error) {
                                // Error handling is done in the hook
                              }
                            }}
                            disabled={option.decrypting || survey.isSubmitting}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full smooth-transition duration-500"></div>
                            {option.decrypting ? (
                              <>
                                <Loader2 className="relative h-3 w-3 animate-spin" />
                                <span className="relative">...</span>
                              </>
                            ) : (
                              <>
                                <Eye className="relative h-3 w-3" />
                                <span className="relative">Decrypt</span>
                              </>
                            )}
                    </button>
                        </div>
                      </div>
                      </div>
                    </div>
                  </div>
                  {option.error && (
                    <div className="mt-2 relative z-10 flex items-start gap-2 text-xs text-rose-600 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg px-2 py-1.5 smooth-transition animate-slide-up border border-rose-200/50">
                      <div className="absolute inset-0 bg-rose-100/30 rounded-lg blur-sm"></div>
                      <AlertCircle className="relative h-3.5 w-3.5 flex-shrink-0 mt-0.5 animate-pulse" />
                      <p className="relative">Unable to decrypt. Please ensure you have access rights and try again.</p>
                    </div>
                  )}
                </div>
              ))}
              {survey.options.length === 0 && (
                <p className="text-sm text-slate-500">No options available yet.</p>
              )}
            </div>
          </section>
        </>
      )}

      {formattedStatus && (
        <div className="rounded-2xl border border-indigo-200/80 bg-gradient-to-r from-indigo-50/90 via-purple-50/70 to-indigo-50/90 p-4 text-sm text-indigo-800 shadow-lg animate-slide-up smooth-transition relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-100/50 to-purple-100/50 blur-xl"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full smooth-transition duration-1000"></div>
          <div className="relative flex items-start gap-2">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-300 rounded-full blur-md opacity-50 animate-pulse"></div>
              <Info className="relative h-5 w-5 text-indigo-600 flex-shrink-0 animate-bounce-subtle" />
            </div>
            <p className="flex-1 font-medium">
              {formattedStatus.includes("reverted") || formattedStatus.includes("execution") || formattedStatus.includes("0x") 
                ? formattedStatus.replace(/0x[a-fA-F0-9]+/g, "[hidden]").replace(/execution reverted.*/gi, "Operation failed. Please try again.")
                : formattedStatus
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
