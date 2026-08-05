// src/components/VotesDisplay.tsx

import React from 'react';
import { Grid, Typography, Paper, Button, Box, Tooltip } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import BarChartIcon from '@mui/icons-material/BarChart';
import VotingSection from './VotingSection';

interface VotesDisplayProps {
  users: { id: string; name: string }[];
  votes: { [key: string]: number | string | null };
  showVotes: boolean;
  votingOptions: (number | string)[];
  isCreator: boolean;
  handleResetVotes: () => void;
  handleToggleVotes: () => void;
  selectedVote: number | string | null;
  handleVote: (vote: number | string) => void;
  handleResetMyVote: () => void;
}

const VotesDisplay: React.FC<VotesDisplayProps> = ({
  users,
  votes,
  showVotes,
  votingOptions,
  isCreator,
  handleResetVotes,
  handleToggleVotes,
  selectedVote,
  handleVote,
  handleResetMyVote,
}) => {
  const getAverageDetails = () => {
    const validVotes = users
      .map((user) => votes[user.id])
      .filter((val): val is number | string => val !== null && val !== undefined && val !== '?');

    if (validVotes.length === 0) return null;

    const numericVotes = validVotes
      .filter((val) => typeof val === 'number' || (!isNaN(Number(val)) && typeof val === 'string'))
      .map((val) => Number(val));

    if (numericVotes.length > 0) {
      const sum = numericVotes.reduce((acc, curr) => acc + curr, 0);
      const avg = sum / numericVotes.length;
      const formattedAvg = Number.isInteger(avg) ? avg.toString() : avg.toFixed(1);

      const numericOptions = votingOptions
        .map((opt) => Number(opt))
        .filter((opt) => !isNaN(opt));

      let closestOpt = numericOptions[0];
      if (numericOptions.length > 0) {
        closestOpt = numericOptions.reduce((prev, curr) =>
          Math.abs(curr - avg) < Math.abs(prev - avg) ? curr : prev
        );
      }

      return {
        isNumeric: true,
        average: formattedAvg,
        closest: closestOpt,
        count: numericVotes.length,
      };
    } else {
      // Frequency count for non-numeric scales (e.g. T-Shirt sizes)
      const counts: { [key: string]: number } = {};
      validVotes.forEach((v) => {
        const key = String(v);
        counts[key] = (counts[key] || 0) + 1;
      });

      let mostPopular = String(validVotes[0]);
      let maxCount = 0;
      for (const key in counts) {
        if (counts[key] > maxCount) {
          maxCount = counts[key];
          mostPopular = key;
        }
      }

      return {
        isNumeric: false,
        mostPopular,
        count: validVotes.length,
      };
    }
  };

  const getConsensusDetails = () => {
    const allUsersVoted = users.length > 0 && users.every((u) => votes[u.id] !== null && votes[u.id] !== undefined);
    const validVotes = users
      .map((user) => votes[user.id])
      .filter((val): val is number | string => val !== null && val !== undefined && val !== '?');

    if (allUsersVoted && validVotes.length > 0 && validVotes.every((val) => val === validVotes[0])) {
      return { isConsensus: true, consensusValue: validVotes[0] };
    }
    return { isConsensus: false, consensusValue: null };
  };

  const getVoteDistribution = () => {
    const distributionMap: { [key: string]: { count: number; voters: string[] } } = {};

    // Initialize all options in voting scale deck
    votingOptions.forEach((option) => {
      distributionMap[String(option)] = { count: 0, voters: [] };
    });

    users.forEach((user) => {
      const voteVal = votes[user.id];
      if (voteVal !== null && voteVal !== undefined) {
        const key = String(voteVal);
        if (!distributionMap[key]) {
          distributionMap[key] = { count: 0, voters: [] };
        }
        distributionMap[key].count += 1;
        distributionMap[key].voters.push(user.name);
      }
    });

    const totalVotes = users.filter((u) => votes[u.id] !== undefined && votes[u.id] !== null).length;
    const maxCount = Math.max(...Object.values(distributionMap).map((d) => d.count), 1);

    return {
      totalVotes,
      maxCount,
      items: votingOptions.map((option) => {
        const key = String(option);
        const data = distributionMap[key] || { count: 0, voters: [] };
        return {
          val: key,
          count: data.count,
          voters: data.voters,
          percentage: totalVotes > 0 ? Math.round((data.count / totalVotes) * 100) : 0,
          heightPercentage: Math.round((data.count / maxCount) * 100),
        };
      }),
    };
  };

  const stats = getAverageDetails();
  const consensus = getConsensusDetails();
  const distribution = getVoteDistribution();

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2.5,
        background: 'linear-gradient(145deg, #f8fafc 0%, #edf2f7 100%)',
        border: '1px solid #e2e8f0',
      }}
    >
      <Box
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems="center"
        gap={1.5}
        marginBottom={1.5}
      >
        <Box sx={{ minWidth: 160 }}>
          <Typography variant="h6" fontWeight="bold" color="textPrimary">
            {showVotes ? 'Session Results' : 'Voting Results (Hidden)'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {users.length} {users.length === 1 ? 'Participant' : 'Participants'}
          </Typography>
        </Box>

        {isCreator && (
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              color={showVotes ? 'warning' : 'success'}
              onClick={handleToggleVotes}
              sx={{ fontWeight: 'bold', borderRadius: 2 }}
            >
              {showVotes ? 'Hide Points' : 'Show Points'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={handleResetVotes}
              sx={{ fontWeight: 'bold', borderRadius: 2 }}
            >
              Reset All Votes
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={2}>
        {/* Left Column: Vertical Vote Distribution Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2.5,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
              <Box display="flex" alignItems="center" gap={1}>
                <BarChartIcon color="primary" />
                <Typography variant="subtitle1" fontWeight="bold" color="textPrimary">
                  Vote Distribution
                </Typography>
              </Box>
              {!showVotes && (
                <Typography variant="caption" color="textSecondary">
                  Hidden until points revealed
                </Typography>
              )}
            </Box>

            {/* Vertical Chart Viewport */}
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: { xs: 1, sm: 1.5 },
                pt: 2.5,
                pb: 0.5,
                minHeight: 130,
                borderBottom: '2px solid #E2E8F0',
              }}
            >
              {distribution.items.map((item) => {
                const hasVotes = showVotes && item.count > 0;
                return (
                  <Box
                    key={item.val}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      height: '100%',
                      width: { xs: 28, sm: 36 },
                    }}
                  >
                    {/* Top Spike Count Badge */}
                    <Typography
                      variant="caption"
                      fontWeight="bold"
                      color={hasVotes ? 'primary' : 'textSecondary'}
                      sx={{ fontSize: '0.65rem', mb: 0.5, whiteSpace: 'nowrap', opacity: hasVotes ? 1 : 0 }}
                    >
                      {hasVotes ? `${item.count}` : ''}
                    </Typography>

                    {/* Vertical Spike Column */}
                    <Tooltip
                      title={showVotes ? (hasVotes ? `Voters: ${item.voters.join(', ')} (${item.percentage}%)` : `Card ${item.val}: 0 votes`) : 'Points hidden'}
                      arrow
                      placement="top"
                    >
                      <Box
                        sx={{
                          width: '100%',
                          maxWidth: 24,
                          height: hasVotes ? `${Math.max(item.heightPercentage, 16)}%` : '4px',
                          background: hasVotes
                            ? 'linear-gradient(180deg, #3B82F6 0%, #1D4ED8 100%)'
                            : '#E2E8F0',
                          borderRadius: '4px 4px 0 0',
                          transition: 'height 0.4s ease, background 0.2s',
                          boxShadow: hasVotes ? '0 2px 6px rgba(59, 130, 246, 0.3)' : 'none',
                          '&:hover': {
                            background: hasVotes
                              ? 'linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)'
                              : '#CBD5E1',
                            cursor: 'pointer',
                          },
                        }}
                      />
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>

            {/* Bottom Scale Axis */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: { xs: 1, sm: 1.5 },
                pt: 1,
              }}
            >
              {distribution.items.map((item) => {
                const hasVotes = showVotes && item.count > 0;
                return (
                  <Box
                    key={item.val}
                    sx={{
                      width: { xs: 28, sm: 36 },
                      textAlign: 'center',
                    }}
                  >
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{
                        color: hasVotes ? '#1E293B' : '#94A3B8',
                        backgroundColor: hasVotes ? '#DBEAFE' : '#F1F5F9',
                        border: hasVotes ? '1px solid #93C5FD' : '1px solid transparent',
                        py: 0.25,
                        px: 0.5,
                        borderRadius: 1,
                        display: 'inline-block',
                        minWidth: 24,
                        fontSize: '0.75rem',
                      }}
                    >
                      {item.val}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Points (when revealed) / Cast Your Vote (when hidden) */}
        <Grid item xs={12} md={6}>
          {showVotes && stats ? (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 2.5,
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {stats.isNumeric ? (
                <Box textAlign="center">
                  <Typography variant="overline" color="textSecondary" sx={{ letterSpacing: 1 }}>
                    Average Story Points
                  </Typography>
                  <Typography
                    data-testid="vote-stats-value"
                    variant="h2"
                    fontWeight="800"
                    sx={{ color: '#1D4ED8', lineHeight: 1.1 }}
                  >
                    {stats.average}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: '#059669', fontWeight: 'bold' }}>
                    Nearest Poker Card: {stats.closest} ({stats.count} {stats.count === 1 ? 'vote' : 'votes'})
                  </Typography>
                </Box>
              ) : (
                <Box textAlign="center">
                  <Typography variant="overline" color="textSecondary" sx={{ letterSpacing: 1 }}>
                    Most Popular Vote
                  </Typography>
                  <Typography
                    data-testid="vote-stats-value"
                    variant="h2"
                    fontWeight="800"
                    sx={{ color: '#1D4ED8', lineHeight: 1.1 }}
                  >
                    {stats.mostPopular}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1, color: '#059669', fontWeight: 'bold' }}>
                    {stats.count} {stats.count === 1 ? 'vote' : 'votes'}
                  </Typography>
                </Box>
              )}
            </Paper>
          ) : (
            <VotingSection
              votingOptions={votingOptions}
              selectedVote={selectedVote}
              handleVote={handleVote}
              handleResetMyVote={handleResetMyVote}
            />
          )}
        </Grid>
      </Grid>

      {showVotes && consensus.isConsensus && (
        <Box display="flex" justifyContent="center" width="100%" sx={{ mt: 2 }}>
          <Paper
            elevation={0}
            sx={{
              py: 0.5,
              px: 2,
              borderRadius: 1.5,
              background: 'linear-gradient(90deg, #059669 0%, #10B981 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.75,
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)',
            }}
          >
            <EmojiEventsIcon sx={{ fontSize: 18 }} />
            <Typography variant="body2" fontWeight="bold">
              100% Consensus Reached! Team agreed on {consensus.consensusValue}
            </Typography>
          </Paper>
        </Box>
      )}
    </Paper>
  );
};

export default VotesDisplay;
