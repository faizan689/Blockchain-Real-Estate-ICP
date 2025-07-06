import { getDatabaseConnection, isDataBaseConnected } from './db';
import { DatabaseStorage, IStorage } from './storage';
import { supabaseStorage } from './supabase-storage';
import seed from './seed';

// In-memory storage for development fallback
class MemoryStorage implements IStorage {
  private properties: any[] = [];
  private users: any[] = [];
  private investments: any[] = [];
  private transactions: any[] = [];
  private proposals: any[] = [];
  private votes: any[] = [];
  private nextId = 1;

  constructor() {
    this.initializeWithMockData();
  }

  private initializeWithMockData() {
    // Add demo users
    this.users = [
      { id: 1, name: "John Doe", email: "john@example.com", walletAddress: "0x95868a76A768Ea791B28a4866106f3743dbEA2e8", kycStatus: "approved" },
      { id: 2, name: "Jane Smith", email: "jane@example.com", walletAddress: "0x742d35C6C965B12BfF04c9E5A4A9b8b4e8C8F2A3", kycStatus: "approved" }
    ];

    // Add demo properties
    this.properties = [
      {
        id: 1,
        title: "Manhattan Luxury Residence",
        description: "Prime real estate in the heart of Manhattan",
        location: "New York, NY",
        propertyType: "residential",
        totalValue: "2500000",
        minInvestment: "5000",
        expectedROI: "8.5",
        availableTokens: 1500,
        totalTokens: 2500,
        imageUrl: "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop",
        isActive: true
      },
      {
        id: 2,
        title: "Austin Tech Hub",
        description: "Commercial property in Austin's tech district",
        location: "Austin, TX", 
        propertyType: "commercial",
        totalValue: "1800000",
        minInvestment: "3000",
        expectedROI: "7.2",
        availableTokens: 800,
        totalTokens: 1800,
        imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop",
        isActive: true
      }
    ];

    // Add demo investments
    this.investments = [
      { id: 1, userId: 1, propertyId: 1, tokensOwned: 100, investmentAmount: "10000", currentValue: "10500", purchaseDate: new Date().toISOString(), isActive: true },
      { id: 2, userId: 1, propertyId: 2, tokensOwned: 50, investmentAmount: "5000", currentValue: "5200", purchaseDate: new Date().toISOString(), isActive: true }
    ];

    // Add demo transactions
    this.transactions = [
      { id: 1, userId: 1, propertyId: 1, type: "purchase", amount: "10000", tokens: 100, transactionHash: "0xabc123", createdAt: new Date().toISOString() }
    ];

    // Add demo proposals  
    this.proposals = [
      { id: 1, propertyId: 1, title: "Property Maintenance Upgrade", description: "Upgrade HVAC systems", votesFor: 150, votesAgainst: 25, status: "active", createdAt: new Date().toISOString() }
    ];

    this.nextId = 10;
  }

  // User operations
  async getUser(id: number) {
    return this.users.find(u => u.id === id);
  }

  async getUserByEmail(email: string) {
    return this.users.find(u => u.email === email);
  }

  async createUser(user: any) {
    const newUser = { ...user, id: this.nextId++ };
    this.users.push(newUser);
    return newUser;
  }

  // Property operations
  async getProperties() {
    return this.properties;
  }

  async getProperty(id: number) {
    return this.properties.find(p => p.id === id);
  }

  async createProperty(property: any) {
    const newProperty = { ...property, id: this.nextId++ };
    this.properties.push(newProperty);
    return newProperty;
  }

  async updatePropertyTokens(id: number, availableTokens: number) {
    const property = this.properties.find(p => p.id === id);
    if (property) {
      property.availableTokens = availableTokens;
    }
  }

  // Investment operations
  async getInvestments() {
    return this.investments;
  }

  async getInvestmentsByUser(userId: number) {
    return this.investments.filter(i => i.userId === userId);
  }

  async getInvestmentsByProperty(propertyId: number) {
    return this.investments.filter(i => i.propertyId === propertyId);
  }

  async createInvestment(investment: any) {
    const newInvestment = { ...investment, id: this.nextId++ };
    this.investments.push(newInvestment);
    return newInvestment;
  }

  async updateInvestmentValue(id: number, currentValue: string) {
    const investment = this.investments.find(i => i.id === id);
    if (investment) {
      investment.currentValue = currentValue;
    }
  }

  // Transaction operations
  async getTransactions() {
    return this.transactions;
  }

  async getTransactionsByUser(userId: number) {
    return this.transactions.filter(t => t.userId === userId);
  }

  async createTransaction(transaction: any) {
    const newTransaction = { ...transaction, id: this.nextId++ };
    this.transactions.push(newTransaction);
    return newTransaction;
  }

  // Proposal operations
  async getProposals() {
    return this.proposals;
  }

  async getActiveProposals() {
    return this.proposals.filter(p => p.status === 'active');
  }

  async getProposal(id: number) {
    return this.proposals.find(p => p.id === id);
  }

  async createProposal(proposal: any) {
    const newProposal = { ...proposal, id: this.nextId++ };
    this.proposals.push(newProposal);
    return newProposal;
  }

  async updateProposalVotes(id: number, votesFor: number, votesAgainst: number) {
    const proposal = this.proposals.find(p => p.id === id);
    if (proposal) {
      proposal.votesFor = votesFor;
      proposal.votesAgainst = votesAgainst;
    }
  }

  // Vote operations
  async getVotes() {
    return this.votes;
  }

  async getVotesByProposal(proposalId: number) {
    return this.votes.filter(v => v.proposalId === proposalId);
  }

  async getVoteByUserAndProposal(userId: number, proposalId: number) {
    return this.votes.find(v => v.userId === userId && v.proposalId === proposalId);
  }

  async createVote(vote: any) {
    const newVote = { ...vote, id: this.nextId++ };
    this.votes.push(newVote);
    return newVote;
  }
}

// Create storage instance based on database connection
export const createStorage = async (): Promise<IStorage> => {
  const { isConnected } = await getDatabaseConnection();
  
  if (isConnected) {
    console.log('✅ Using Supabase database storage');
    // Try to seed database if it's empty
    try {
      const dbStorage = new DatabaseStorage();
      const properties = await dbStorage.getProperties();
      if (properties.length === 0) {
        console.log('🌱 Seeding database with sample data...');
        await seed();
        console.log('✅ Database seeded successfully');
      }
      return supabaseStorage; // Use enhanced Supabase storage with real-time features
    } catch (error) {
      console.log('⚠️  Database seeding failed, but connection is available');
      return new DatabaseStorage();
    }
  } else {
    console.log('✅ In-memory storage seeded with demo data');
    return new MemoryStorage();
  }
};